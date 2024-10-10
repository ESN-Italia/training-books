import { parameters, DOMAIN, } from '../../../back-end/deploy/environments';

/**
 * The stage to use for API (and websocket) requests.
 */
const STAGE = 'dev';
/**
 * Variables to configure an ITER IDEA's cloud app, together with its inner modules.
 */
export const environment = {
  idea: {
    project: 'training-books',
    app: {
      version: '0.0.1',
      url: DOMAIN,
    },
    api: {
      url: parameters.apiDomain,
      stage: STAGE
    },
    ionicExtraModules: ['common']
  }
};
