#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { ResourceController, ApiStack } from './api-stack';

const PARAMETERS = {
  project: 'commit',
  awsAccount: '798561285421',
  awsRegion: 'eu-south-1',
  apiDomain: 'api.commitesn.link'
};
const STAGE = 'YOUR_INITIALS';

//
// RESOURCES
//

const apiResources: ResourceController[] = [{ name: 'books', paths: ['/books', '/books/{bookId}'] }];

//
// STACKS
//

const createApp = async (): Promise<void> => {
  const app = new cdk.App({});
  const env = { account: PARAMETERS.awsAccount, region: PARAMETERS.awsRegion };
  new ApiStack(app, `${PARAMETERS.project}-${STAGE}-api`, {
    env,
    stage: STAGE,
    project: PARAMETERS.project,
    apiDomain: PARAMETERS.apiDomain,
    apiDefinitionFile: './swagger.yaml',
    resourceControllers: apiResources,
    removalPolicy: cdk.RemovalPolicy.DESTROY
  });
};
createApp();
