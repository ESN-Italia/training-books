import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import SwaggerParser from '@apidevtools/swagger-parser';

const workshop_deploy = async () => {
    // 1.   Setting up structure and default values

    // Parse the OpenAPI (Swagger) definition, to integrate it with AWS resources
    const apiDefinition: any = await SwaggerParser.dereference('./swagger.yaml'); // TODO: get from global config
    apiDefinition['x-amazon-apigateway-cors'] = {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['Content-Type', 'Authorization']
    };

    // Set metadata to recognize APIs in the API Gateway console
    apiDefinition.info.description = apiDefinition.info.title;
    apiDefinition.info.title = "commit"; // TODO: get from PULUMI

    // 2.   Setup Lambda functions

    const resourceIntegrationSetting = {
        type: 'AWS_PROXY',
        httpMethod: 'POST',
        payloadFormatVersion: '2.0'
    };

    const lambdaFunctions : pulumi.Output<string>[] = [];

    // Create a Lambda function for each Resource Controller
    [{ name: 'books', paths: ['/books', '/books/{bookId}'] }].forEach(resource => { // TODO: iterate on a JSON variable
        const lambdaFnName = "commit".concat('_', "dev", '_', resource.name); // TODO: take project name from config

        // FIXME: code for creating a Policy

        // const region = aws.getRegionOutput().name;
        // const account = aws.getCallerIdentityOutput.name;

        // const accessIDEAResources = new aws.iam.Policy("AccessIDEAResources", {
        //     policy: JSON.stringify({
        //         Version: "2012-10-17",
        //         Statement: [{
        //             Action: ['dynamodb:*', 'lambda:InvokeFunction'],
        //             Effect: "Allow",
        //             Resource: `*`,   // TODO: add ${region}:${account}; add function (see Carbo's code)
        //         }]
        //     }),
        // });

        // params.lambdaFunctions.forEach(lambdaFn => {
        //   if (lambdaFn.role) lambdaFn.role.attachInlinePolicy(accessIDEAResources);
        // });

        // TODO: Change it to a Policy one
        const lambdaRole = new aws.iam.Role("lambdaRole", {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.LambdaPrincipal),
            managedPolicyArns: [aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole, aws.iam.ManagedPolicy.AmazonDynamoDBFullAccess]
        });

        const lambdaFn = new aws.lambda.Function("fn", {
            role: lambdaRole.arn,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./src/")
            }),
            name: lambdaFnName,
            runtime: aws.lambda.Runtime.NodeJS16dX,
            handler: `./handlers/${resource.name}.handler`,
            environment: {
                variables: {
                    NODE_OPTIONS: "--enable-source-maps",
                    PROJECT: "commit",  // TODO: take project name from config
                    STAGE: "dev",       // TODO: take project name from config
                    RESOURCE: `${resource.name}`,
                }
            },
            // TODO: add other default values?
        });

        lambdaFunctions.push(lambdaFn.invokeArn);

        // Allow the api to execute the Lambda function
        const permission = new aws.lambda.Permission("permission", {
            action: "lambda:InvokeFunction",
            function: lambdaFn.name,
            principal: "apigateway.amazonaws.com",
            // sourceArn: ......    // TODO: add correct sourceArn
        });

    });

    // 3.   Setup up API gateway

    const api = new aws.apigatewayv2.Api("HttpApi", {
        protocolType: "HTTP",
        body: pulumi
        .all(lambdaFunctions)
        .apply((functionArn) => {
            [{ name: 'books', paths: ['/books', '/books/{bookId}'] }].forEach((resource, index) => { // TODO: iterate on a JSON variable
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

    // TODO: we can remove it, since it's not needed for the workshop. AWS is already generating a usable URL for us
    // const apiDomain = new aws.apigatewayv2.DomainName("HttpDomain", {
    //     domainName: "ws-api.example.com",
    //     domainNameConfiguration: {
    //         certificateArn: aws_acm_certificate.example.arn,
    //         endpointType: "REGIONAL",
    //         securityPolicy: "TLS_1_2",
    //     },
    // });

    // const HttpRoute = new aws.apigatewayv2.Route("HttpRoute", {
    //     apiId: api.id,
    //     routeKey: "$default", // This is a default catch-all route
    // });

    // const apiMapping = new aws.apigatewayv2.ApiMapping("HttpApiMapping", {
    //     apiId: api.id,
    //     domainName: apiDomain.id,
    //     stage: apiStage.id,                       // TODO: take from config
    // });

    // 4.   Create stage and deploy

    const deploy = new aws.apigatewayv2.Deployment("commit-deploy", {
        apiId: api.id,
        description: "Example deployment",
    });

    const apiStage = new aws.apigatewayv2.Stage("HttpApiDefaultStage", {
        apiId: api.id,
        deploymentId: deploy.id,
        name: "dev", // TODO: take from config?
        // autoDeploy: true
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
    }/*, {
        protect: true,
    }*/);

    //TODO: It would be nice to print out API URL after deployment

    // console.log(`${apiStage.invokeUrl}`);
    // console.log(pulumi.interpolate`${apiStage.invokeUrl}`)
};
workshop_deploy();

// export const url = pulumi.interpolate`${apiStage.invokeUrl}`;
