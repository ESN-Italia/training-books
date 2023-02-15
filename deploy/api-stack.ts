import SwaggerParser from '@apidevtools/swagger-parser';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as ApiGw from 'aws-cdk-lib/aws-apigatewayv2';

export interface ApiProps extends cdk.StackProps {
  project: string;
  stage: string;
  apiDomain: string;
  apiDefinitionFile: string;
  resourceControllers: ResourceController[];
  removalPolicy: RemovalPolicy;
}
export interface ResourceController {
  name: string;
  paths?: string[];
}

const defaultLambdaFnProps: NodejsFunctionProps = {
  runtime: Lambda.Runtime.NODEJS_14_X,
  architecture: Lambda.Architecture.ARM_64,
  timeout: Duration.seconds(10),
  memorySize: 1024,
  bundling: { minify: true, sourceMap: true },
  environment: { NODE_OPTIONS: '--enable-source-maps' },
  logRetention: RetentionDays.TWO_WEEKS
};

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id, props);
    this.init(scope, id, props);
  }

  private async init(_: Construct, id: string, props: ApiProps): Promise<void> {
    const { api } = await this.createAPIAndStage({
      stackId: id,
      stage: props.stage,
      apiDomain: props.apiDomain,
      apiDefinitionFile: props.apiDefinitionFile
    });
    new cdk.CfnOutput(this, 'HTTPApiURL', { value: api.attrApiEndpoint });

    const { lambdaFunctions } = this.createLambdaFunctionsAndLinkThemToAPI({
      api,
      resourceControllers: props.resourceControllers,
      defaultLambdaFnProps,
      project: props.project,
      stage: props.stage
    });
    this.allowLambdaFunctionsToAccessTablesAndFunctions({ lambdaFunctions: Object.values(lambdaFunctions) });
  }

  //
  // HELPERS
  //

  private async createAPIAndStage(params: {
    stackId: string;
    stage: string;
    apiDefinitionFile: string;
    apiDomain: string;
  }): Promise<{ api: cdk.aws_apigatewayv2.CfnApi }> {
    const api = new ApiGw.CfnApi(this, 'HttpApi');

    // parse the OpenAPI (Swagger) definition, to integrate it with AWS resources
    const apiDefinition: any = await SwaggerParser.dereference(params.apiDefinitionFile);
    apiDefinition['x-amazon-apigateway-cors'] = {
      allowOrigins: ['*'],
      allowMethods: ['*'],
      allowHeaders: ['Content-Type', 'Authorization']
    };

    // set metadata to recognize the API in the API Gateway console
    apiDefinition.info.description = apiDefinition.info.title;
    apiDefinition.info.title = params.stackId;

    // note: it's important to set it here and not earlier, so we are sure all the attributes have been already set
    api.body = apiDefinition;

    const apiStage = new ApiGw.CfnStage(this, 'HttpApiDefaultStage', {
      apiId: api.ref,
      stageName: '$default',
      autoDeploy: true
    });

    new ApiGw.CfnApiMapping(this, 'HttpApiMapping', {
      domainName: params.apiDomain,
      apiId: api.ref,
      apiMappingKey: params.stage,
      stage: apiStage.ref
    });

    return { api };
  }

  private createLambdaFunctionsAndLinkThemToAPI(params: {
    project: string;
    stage: string;
    resourceControllers: ResourceController[];
    defaultLambdaFnProps: NodejsFunctionProps;
    api: cdk.aws_apigatewayv2.CfnApi;
  }): {
    lambdaFunctions: { [resourceName: string]: NodejsFunction };
  } {
    const lambdaFunctions: { [resourceName: string]: NodejsFunction } = {};

    const resourceIntegrationSetting = {
      type: 'AWS_PROXY',
      httpMethod: 'POST',
      payloadFormatVersion: '2.0'
    };

    // create a Lambda function for each Resource Controller
    params.resourceControllers.forEach(resource => {
      const lambdaFnName = params.project.concat('_', params.stage, '_', resource.name);
      const lambdaFn = new NodejsFunction(this, resource.name.concat('Function'), {
        ...params.defaultLambdaFnProps,
        functionName: lambdaFnName,
        entry: `./src/handlers/${resource.name}.ts`
      });

      // link the Lambda function to the Resource Controller's paths (if any)
      if (resource.paths) {
        resource.paths.forEach(path => {
          if (params.api.body.paths[path]) {
            Object.keys(params.api.body.paths[path]).forEach(method => {
              params.api.body.paths[path][method]['x-amazon-apigateway-integration'] = {
                ...resourceIntegrationSetting,
                uri: lambdaFn.functionArn
              };
            });
          }
        });
      }

      // allow the api to execute the Lambda function
      const region = cdk.Stack.of(this).region;
      const account = cdk.Stack.of(this).account;
      lambdaFn.addPermission(`${resource.name}-permission`, {
        principal: new IAM.ServicePrincipal('apigateway.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn: `arn:aws:execute-api:${region}:${account}:${params.api.ref}/*/*/*`
      });

      lambdaFn.addEnvironment('PROJECT', params.project);
      lambdaFn.addEnvironment('STAGE', params.stage);
      lambdaFn.addEnvironment('RESOURCE', resource.name);

      lambdaFunctions[resource.name] = lambdaFn;
    });

    return { lambdaFunctions };
  }
  private allowLambdaFunctionsToAccessTablesAndFunctions(params: { lambdaFunctions: NodejsFunction[] }): void {
    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;
    const accessIDEAResources = new IAM.Policy(this, 'AccessIDEAResources', {
      statements: [
        new IAM.PolicyStatement({
          effect: IAM.Effect.ALLOW,
          actions: ['dynamodb:*', 'lambda:InvokeFunction'],
          resources: [`arn:aws:dynamodb:${region}:${account}:table/*`, `arn:aws:lambda:${region}:${account}:function:*`]
        })
      ]
    });

    params.lambdaFunctions.forEach(lambdaFn => {
      if (lambdaFn.role) lambdaFn.role.attachInlinePolicy(accessIDEAResources);
    });
  }
}
