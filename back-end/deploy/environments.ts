
/**
 * The codename of the project.
 */
export const PROJECT = 'training-books';
/**
 * The purchased domain to use.
 */
export const DOMAIN = 'commit-esnitalia.click';
/**
 * An additional custom domain to use.
 */
export const PROD_CUSTOM_DOMAIN: string | null = null; // in case of first creation, use: `null`

export const parameters: Parameters = {
  project: PROJECT,
  apiDomain: 'api.'.concat(DOMAIN)
};


export interface Parameters {
  /**
   * Project key (unique to the AWS account).
   */
  project: string;
  /**
   * HTTP API for each environment will be available at `${apiDomain}/${env.stage}`.
   */
  apiDomain: string;
}

export interface Stage {
  /**
   * The domain name where to reach the front-end.
   */
  domain: string;
  /**
   * The (optional) alternative domain names to reach the front-end.
   */
  alternativeDomains?: string[];
  /**
   * Whether to delete the data when the environment is deleted.
   * It should be True for dev and False for prod environments.
   */
  destroyDataOnDelete: boolean;
  /**
   * The minimum level of log to print in functions (default: `INFO`).
   */
  logLevel?: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}
