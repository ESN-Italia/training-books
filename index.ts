import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import SwaggerParser from '@apidevtools/swagger-parser';

/* CONFIGS */
const CONFIG = {
    stage: 'YOUR_INITIALS',
    apiDefinitionFile: './swagger.yaml'
};
// Note: AWS configs like username or region are already inside pulumi

const apiroutes = [{ name: 'books', paths: ['/books', '/books/{bookId}'] }];

const defaultLambdaFnProps = {
    runtime: aws.lambda.Runtime.NodeJS14dX,
    architectures: ["arm64"],
    timeout: 10,
    memorySize: 1024,
  };

// Deployment code
const workshop_deploy = async () => {

    // 1.   Setting up structure and default values
    const region = aws.config.region;
    const account = await aws.getCallerIdentity({}).then(current => current.accountId);

    const lambdaFunctionArns : pulumi.Output<string>[] = [];

    // Parse the OpenAPI (Swagger) definition, to integrate it with AWS resources
    const apiDefinition: any = await SwaggerParser.dereference(CONFIG.apiDefinitionFile);
    apiDefinition['x-amazon-apigateway-cors'] = {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['Content-Type', 'Authorization']
    };

    // Set metadata to recognize APIs in the API Gateway console
    apiDefinition.info.description = apiDefinition.info.title;
    apiDefinition.info.title = pulumi.getStack();


    // 2.   Setup Lambda functions

    const resourceIntegrationSetting = {
        type: 'AWS_PROXY',
        httpMethod: 'POST',
        payloadFormatVersion: '2.0'
    };

    // Create a Role for the lambda function to provide it permissions
    const lambdaRole = new aws.iam.Role("LambdaFnRole", {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
    });

    // Attach cloudwatch's specific permissions
    const cloudwatchLogGroup = new aws.cloudwatch.LogGroup("commitLogs", {retentionInDays: 1});
    const lambdaLoggingPolicyDocument = aws.iam.getPolicyDocument({
        statements: [{
            effect: "Allow",
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
            ],
            resources: ["arn:aws:logs:*:*:*"],
        }],
    });
    const lambdaLoggingPolicy = new aws.iam.Policy("lambdaLoggingPolicy", {
        path: "/",
        description: "IAM policy for logging from a lambda",
        policy: lambdaLoggingPolicyDocument.then(lambdaLoggingPolicyDocument => lambdaLoggingPolicyDocument.json),
    });
    const lambdaLogs = new aws.iam.RolePolicyAttachment("lambdaLogs", {
        role: lambdaRole.name,
        policyArn: lambdaLoggingPolicy.arn,
    });

    // Attach lambda function's specific permissions
    const accessIDEAResources = new aws.iam.Policy("AccessIDEAResources", {
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: ['dynamodb:*', 'lambda:InvokeFunction'],
                Effect: "Allow",
                Resource: [`arn:aws:dynamodb:${region}:${account}:table/*`, `arn:aws:lambda:${region}:${account}:function:*`]
            }]
        }),
    });

    const lambdaRolePolicyAttachment = new aws.iam.RolePolicyAttachment("lambdaRolePolicyAttachment", {
        role: lambdaRole.name,
        policyArn: accessIDEAResources.arn,
    });

    // Create a Lambda function for each Resource Controller
    apiroutes.forEach(resource => {
        const lambdaFnName = pulumi.getStack().concat('_', "dev", '_', resource.name);

        const lambdaFn = new aws.lambda.Function("fn", {
            ...defaultLambdaFnProps,
            role: lambdaRole.arn,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./src/")
            }),
            name: lambdaFnName,
            handler: `./handlers/${resource.name}.handler`,
            environment: {
                variables: {
                    NODE_OPTIONS: "--enable-source-maps",
                    PROJECT: pulumi.getStack(),
                    STAGE: CONFIG.stage,
                    RESOURCE: `${resource.name}`,
                }
            }
        });

        lambdaFunctionArns.push(lambdaFn.invokeArn);
    });


    // 3.   Setup up API gateway

    const api = new aws.apigatewayv2.Api("HttpApi", {
        protocolType: "HTTP",
        body: pulumi
        .all(lambdaFunctionArns)
        .apply((functionArn) => {
            /* Unfortunately Pulumi, to my understanding, seems to not suit perfectly OpenAPI yet.
             * Pulumi provides a highly parallelizable infrastructure, that leads to a big trouble when it is needed
             * to connect lambdas to the API Gateway, since it's not known when Lambdas ARNs will be available.
             * This is a workaround to fix the issue.
             */
            apiroutes.forEach((resource, index) => {
                if (resource.paths) {
                    resource.paths.forEach(path => {
                        if (apiDefinition.paths[path]) {
                            Object.keys(apiDefinition.paths[path]).forEach(method => {
                                    apiDefinition.paths[path][method]['x-amazon-apigateway-integration'] = {
                                    ...resourceIntegrationSetting,
                                    uri: functionArn[index]
                                };
                            });
                        }
                    });
                }
            });

            return JSON.stringify(apiDefinition)
        }),
    });

    // Give permission to Gateway API to execute the lambda functions
    apiroutes.forEach(resource => {
        const lambdaFnName = pulumi.getStack().concat('_', "dev", '_', resource.name);

        const permission = new aws.lambda.Permission("permission", {
            action: "lambda:InvokeFunction",
            function: lambdaFnName,
            principal: "apigateway.amazonaws.com",
            sourceArn: pulumi.interpolate`${api.executionArn}/*`
        });
    });


    // 4.   Create stage and deploy

    const deploy = new aws.apigatewayv2.Deployment("commit-deploy", {
        apiId: api.id,
        description: "Example deployment",
    });

    const apiStage = new aws.apigatewayv2.Stage("HttpApiDefaultStage", {
        apiId: api.id,
        deploymentId: deploy.id,
        name: CONFIG.stage,
        autoDeploy: true
    });


    // 5.   Create DynamoDB tables

    const booksTable = new aws.dynamodb.Table("ms_books", {
        attributes: [{
            name: "genre-year_of_publication-index",
            type: "S",
        }],
        hashKey: "genre-year_of_publication-index",
        name: "ms_books",
        pointInTimeRecovery: {
            enabled: false,
        },
        readCapacity: 1,
        ttl: {
            attributeName: "",
        },
        writeCapacity: 1,
    }, {
        protect: false, // Put to 'true' to block 'pulumi destroy'
    });

    return apiStage.invokeUrl;
};

export const url = pulumi.interpolate`${workshop_deploy()}/books`;
