# Fullstack Training Project

This repository contains a fullstack training project designed to demonstrate the integration of a modern frontend framework (Angular 18) with a robust, scalable backend infrastructure using AWS Cloud Development Kit (CDK). The project serves as an educational tool for understanding how to develop, deploy, and manage a fullstack application on the AWS cloud.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Deployment](#deployment)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

This project demonstrates the creation of a fullstack application where the frontend is built with Angular 18, and the backend is constructed and deployed using AWS CDK. The project aims to provide a hands-on approach to learning fullstack development, cloud infrastructure as code (IaC), and deploying web applications to AWS.

## Architecture

The application consists of two main parts:

1. **Frontend:** Developed using Angular 18, a powerful framework for building client-side applications.
2. **Backend:** Deployed on AWS using the AWS Cloud Development Kit (CDK), which is used to define cloud infrastructure in code. The backend may include services like API Gateway, Lambda, DynamoDB, and more, depending on the application's requirements.

## Technologies Used

- **Frontend:** Angular 18, TypeScript, HTML, CSS
- **Backend:** AWS CDK (TypeScript), AWS Lambda, API Gateway, DynamoDB

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (tested with v20.13)
- **npm** (tested with v10.5)
- **Angular CLI** (tested with v18.2)
- **AWS CLI v2** (tested v2.18.3) — v2 is mandatory: AWS CLI v1 cannot authenticate against IAM Identity Center.
- **AWS CDK** (tested v2.166.0)
- **TypeScript** (tested with v5.5.3)

You also need access to the training AWS account through **AWS IAM Identity Center** (formerly AWS SSO), with a permission set that allows creating Lambda functions, API Gateway APIs, DynamoDB tables, S3 buckets and CloudFront distributions (e.g. `PowerUserAccess`). Ask the trainers to grant you access to the account if you don't see it in the access portal.

## Setup Instructions

1. **Branch**: Create a branch with your initials, and work only in this branch.

2. **AWS Profile (IAM Identity Center)**: The deploy scripts always pass `--profile training-books`, so the profile **must** be named exactly `training-books`.

   Run the guided setup once:

   ```bash
   aws configure sso --profile training-books
   ```

   The command asks a first group of questions, about the login itself:

   | Prompt | Value |
   | --- | --- |
   | SSO session name | `esn-italia` (any name; it only groups the login in your local config) |
   | SSO start URL | `https://esn-italia.awsapps.com/start` |
   | SSO region | `eu-south-1` |
   | SSO registration scopes | `sso:account:access` (accept the default) |

   At this point a browser window opens: sign in and approve the request. Back in the terminal, the CLI lists the accounts and the roles available to you: select the training account, then the permission set granted to you (e.g. `PowerUserAccess`). Use the arrow keys and confirm with Enter.

   Then it asks a second group of questions, about the profile it is writing:

   | Prompt | Value |
   | --- | --- |
   | CLI default client Region | `eu-south-1` (or whatever you prefer) |
   | CLI default output format | `json` |
   | CLI profile name | `training-books` (only asked if you omitted `--profile` above) |

   The result in `~/.aws/config` looks like this:

   ```ini
   [profile training-books]
   sso_session = esn-italia
   sso_account_id = 123456789012
   sso_role_name = PowerUserAccess
   region = eu-south-1
   output = json

   [sso-session esn-italia]
   sso_start_url = https://esn-italia.awsapps.com/start
   sso_region = eu-south-1
   sso_registration_scopes = sso:account:access
   ```

   > **Migrating from the old IAM user setup?** Delete any leftover `[training-books]` section from `~/.aws/credentials`. That file takes precedence over `~/.aws/config`, so old static `aws_access_key_id` / `aws_secret_access_key` entries silently shadow the Identity Center profile and you get confusing `InvalidClientTokenId` or `AccessDenied` errors even after a successful login.

   [AWS Docs: configure the AWS CLI for IAM Identity Center](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

3. **Log in**: unlike IAM access keys, Identity Center credentials are temporary and expire (typically after 8–12 hours). Start each working session with:

   ```bash
   aws sso login --profile training-books
   ```

   Check that it worked with:

   ```bash
   aws sts get-caller-identity --profile training-books
   ```

   When a deploy suddenly fails with `Error loading SSO Token`, `The SSO session has expired` or `ExpiredToken`, you just need to run `aws sso login` again.

### Backend Setup

1. **Install AWS CDK CLI**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap AWS CDK**: Initialize the environment to use AWS CDK. Note the explicit profile: without it the CDK falls back to the default profile, which is not your Identity Center one.
   ```bash
   cdk bootstrap --profile training-books
   ```
   The account only needs to be bootstrapped once per account/region, so if somebody did the training before you this step is likely already done, and the command is a no-op.

3. **Install Dependencies**: Navigate to the backend directory and install the necessary dependencies.
   ```bash
   cd back-end
   npm install
   ```
4. **Modify the stage**: Open the file `back-end/deploy/main.ts` and change the variable `STAGE` from `dev` to your initials.
   ```typescript
   //
   // STAGE
   //
   const STAGE = "dev"; //substitute with your initials
   ```

5. **Deploy the Backend**:
   ```bash
   ./deploy.sh <your_initials>
   ```
   This command will deploy the infrastructure defined in the CDK stack to AWS. This will take a while.

### Frontend Setup

1. **Install Angular CLI**:
   ```bash
   npm install -g @angular/cli@18
   ```

2. **Install Dependencies**: Navigate to the frontend directory and install the necessary dependencies.
   ```bash
   cd front-end
   npm install
   ```

3. **Configure the API Endpoint**:
   - Open the environment file (`src/environments/environment.idea.ts`).
   - Replace the `STAGE` constant with the same value you used in the back-end (i.e. your initials)

4. **Run the Development Server**:
   ```bash
   npm run start
   ```
   The application will be accessible at `http://localhost:8100/`.

## Deployment

Both deploy scripts use the `training-books` profile, so make sure your Identity Center session is still valid before running them:

```bash
aws sso login --profile training-books
```

### Deploying the Frontend

To deploy the Angular frontend, execute the following script contained inside the `front-end` folder.
  ```bash
    ./release.sh <your-initials>
  ```

### Re-Deploying the Backend

The backend deployment is managed through AWS CDK. To deploy updates to the backend, run:

```bash
./deploy.sh  <your-initials>
```

## Usage

After deployment, you can interact with the application through the Angular frontend. The frontend communicates with the backend via the API Gateway, which triggers Lambda functions to process requests and interact with other AWS services (e.g., DynamoDB).

The objective is to learn the workings of the stack by implementing a CRUD on the Books resource. More information can be found in file `TRAINING.md`

## Troubleshooting

Most setup problems are authentication problems. This project authenticates through AWS IAM Identity Center, whose credentials are **temporary**.

| Error | Cause and fix |
| --- | --- |
| `Error loading SSO Token`, `The SSO session associated with this profile has expired` | Your session expired: run `aws sso login --profile training-books`. |
| `InvalidClientTokenId`, `The security token included in the request is invalid` | Leftover static access keys from the old IAM setup: remove the `[training-books]` section from `~/.aws/credentials`, since that file overrides the Identity Center profile in `~/.aws/config`. |
| `Unable to resolve AWS account to use` / CDK deploys to the wrong account | The profile wasn't passed. Every CDK command needs `--profile training-books` (the `deploy.sh` and `release.sh` scripts already do this). |
| `aws: error: argument operation: Invalid choice: 'sso'` | You're on AWS CLI v1: install [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). |
| `AccessDenied` while creating resources | Your permission set is too restrictive: ask the trainers for one that can create Lambda, API Gateway, DynamoDB, S3 and CloudFront resources. |
| `Missing or Mismatching STAGE` | The `STAGE` constant in `back-end/deploy/main.ts` doesn't match the initials you passed to `./deploy.sh`. |

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

### How to Contribute

1. Create a new branch (`git checkout -b feature-branch`).
2. Commit your changes (`git commit -m 'Add some feature'`).
3. Push to the branch (`git push origin feature-branch`).
4. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.