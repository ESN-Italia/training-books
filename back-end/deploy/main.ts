#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as DDB from 'aws-cdk-lib/aws-dynamodb';

import { ApiDomainStack } from './api-domain-stack';
import { ResourceController, ApiStack, DDBTable } from './api-stack';
import { FrontEndStack } from './front-end-stack';

import { parameters, Stage, DOMAIN } from './environments';


//
// STAGE
//
const STAGE = "dev"; //substitute with your initials

//
// RESOURCES
//

const apiResources: ResourceController[] = [{ name: 'books', paths: ['/books', '/books/{bookId}'] }];

const tables: { [tableName: string]: DDBTable } = {
  books: {
    PK: { name: 'bookId', type: DDB.AttributeType.STRING }
  }
};

//
// STACKS
//

const createApp = async (): Promise<void> => {
  const app = new cdk.App({});

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

  const STAGE_fromcontext = app.node.tryGetContext('stage');
  if (STAGE!= STAGE_fromcontext) {
    console.log('Missing or Mismatching STAGE\n\n');
    throw new Error();
  }
  const STAGE_VARIABLES = {
    domain: STAGE.concat('.',DOMAIN),
    destroyDataOnDelete: true,
    logLevel: 'DEBUG'
  } as Stage;
  //(stages as any)[STAGE] as Stage;
  // if (!STAGE_VARIABLES) {
  //   console.log('Missing stage (environments.ts); e.g. --parameters stage=dev\n\n');
  //   throw new Error();
  // }

  //
  // GENERIC RESOURCES (they don't depend by the stage)
  //


  const apiDomainStack = new ApiDomainStack(app, `${parameters.project}-api-domain`, {
    env,
    domain: parameters.apiDomain
  });

  //
  // STAGE-DEPENDANT RESOURCES
  //

  const apiStack = new ApiStack(app, `${parameters.project}-${STAGE}-api`, {
    env,
    project: parameters.project,
    stage: STAGE,
    apiDomain: parameters.apiDomain,
    apiDefinitionFile: './swagger.yaml',
    resourceControllers: apiResources,
    tables,
    lambdaLogLevel: STAGE_VARIABLES.logLevel ?? 'INFO',
    removalPolicy: STAGE_VARIABLES.destroyDataOnDelete ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN
  });
  apiStack.addDependency(apiDomainStack);

  new FrontEndStack(app, `${parameters.project}-${STAGE}-front-end`, {
    env,
    project: parameters.project,
    stage: STAGE,
    domain: STAGE_VARIABLES.domain,
    alternativeDomains: STAGE_VARIABLES.alternativeDomains,
  });
};
createApp();
