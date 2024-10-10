import SwaggerParser from '@apidevtools/swagger-parser';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as ApiGw from 'aws-cdk-lib/aws-apigatewayv2';
import * as DDB from 'aws-cdk-lib/aws-dynamodb';
// import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
// import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface ApiProps extends cdk.StackProps {
  project: string;
  stage: string;
  apiDomain: string;
  apiDefinitionFile: string;
  resourceControllers: ResourceController[];
  tables: { [tableName: string]: DDBTable };
  removalPolicy: RemovalPolicy;
  lambdaLogLevel: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}
export interface ResourceController {
  name: string;
  paths?: string[];
  isAuthFunction?: boolean;
}
export interface DDBTable {
  PK: DDB.Attribute;
  SK?: DDB.Attribute;
  indexes?: DDB.GlobalSecondaryIndexProps[];
  stream?: DDB.StreamViewType;
  expiresAtField?: string;
}

const defaultLambdaFnProps: NodejsFunctionProps = {
  runtime: Lambda.Runtime.NODEJS_18_X,
  architecture: Lambda.Architecture.ARM_64,
  timeout: Duration.seconds(30),
  memorySize: 1024,
  bundling: { minify: true, sourceMap: true },
  environment: { NODE_OPTIONS: '--enable-source-maps' },
  logRetention: RetentionDays.TWO_WEEKS,
  logFormat: Lambda.LogFormat.JSON
};

const defaultDDBTableProps: DDB.TableProps | any = {
  billingMode: DDB.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true
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
      stage: props.stage,
      lambdaLogLevel: props.lambdaLogLevel,
    });

    this.allowLambdaFunctionsToSystemsManager({ lambdaFunctions: Object.values(lambdaFunctions) });
    this.createDDBTablesAndAllowLambdaFunctions({
      project: props.project,
      stage: props.stage,
      tables: props.tables,
      defaultTableProps: defaultDDBTableProps,
      removalPolicy: props.removalPolicy,
      lambdaFunctions: Object.values(lambdaFunctions)
    });
    //
    // PROJECT CUSTOM
    //

    // if (lambdaFunctions['sesNotifications']) {
    //   const topic = Topic.fromTopicArn(this, 'SESTopicToHandleSESBounces', props.ses.notificationTopicArn);
    //   new Subscription(this, 'SESSubscriptionToHandleSESBounces', {
    //     topic,
    //     protocol: SubscriptionProtocol.LAMBDA,
    //     endpoint: lambdaFunctions['sesNotifications'].functionArn
    //   });
    //   lambdaFunctions['sesNotifications'].addEventSource(new SnsEventSource(topic));
    // }
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
    // create Api Construct
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
    lambdaLogLevel: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
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
        entry: `./src/handlers/${resource.name}.ts`,
        applicationLogLevel: params.lambdaLogLevel
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
        sourceArn: `arn:aws:execute-api:${region}:${account}:${params.api.ref}/*/*`
      });

      lambdaFn.addEnvironment('PROJECT', params.project);
      lambdaFn.addEnvironment('STAGE', params.stage);
      lambdaFn.addEnvironment('RESOURCE', resource.name);
      lambdaFunctions[resource.name] = lambdaFn;
    });

    return { lambdaFunctions };
  }

  private allowLambdaFunctionsToSystemsManager(params: { lambdaFunctions: NodejsFunction[] }): void {
    const accessSystemsManagerPolicy = new IAM.Policy(this, 'AccessSystemsManager', {
      statements: [
        new IAM.PolicyStatement({ effect: IAM.Effect.ALLOW, actions: ['ssm:GetParameter'], resources: ['*'] })
      ]
    });
    params.lambdaFunctions.forEach(lambdaFn => {
      if (lambdaFn.role) lambdaFn.role.attachInlinePolicy(accessSystemsManagerPolicy);
    });
  }

  private createDDBTablesAndAllowLambdaFunctions(params: {
    project: string;
    stage: string;
    tables: { [tableName: string]: DDBTable };
    defaultTableProps: DDB.TableProps;
    removalPolicy: RemovalPolicy;
    lambdaFunctions: NodejsFunction[];
  }): { tables: { [tableName: string]: DDB.Table } } {
    const tables: { [tableName: string]: DDB.Table } = {};

    for (const tableName in params.tables) {
      const physicalTableName = params.project.concat('-', params.stage,'_',tableName);
      const table = new DDB.Table(this, tableName.concat('-Table'), {
        ...params.defaultTableProps,
        tableName: physicalTableName,
        partitionKey: params.tables[tableName].PK,
        sortKey: params.tables[tableName].SK,
        removalPolicy: params.removalPolicy,
        stream: params.tables[tableName].stream,
        timeToLiveAttribute: params.tables[tableName].expiresAtField
      });

      (params.tables[tableName].indexes || []).forEach(GSI => table.addGlobalSecondaryIndex(GSI));

      params.lambdaFunctions.forEach(lambdaFn => {
        table.grantReadWriteData(lambdaFn);
        lambdaFn.addEnvironment('DDB_TABLE_'.concat(tableName), physicalTableName);
      });

      tables[tableName] = table;
    }

    return { tables };
  }
}
