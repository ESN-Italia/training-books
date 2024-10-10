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
- **AWS CLI** (tested v2.13.35)
- **AWS CDK** (tested v2.147.1)
- **TypeScript** (tested with v5.5.3)

You also need an AWS account with sufficient permissions to create resources like Lambda functions, API Gateway, DynamoDB tables, etc.



## Setup Instructions
-1. **Branch**: Create a branch with tour initials, work only in this branch.

0. **AWS Profile**: Setup an aws profile named `training-books` pointing to the aws account and region `eu-south-1`(or whatever you prefer). [AWS Docs](https://docs.aws.amazon.com/cli/v1/userguide/cli-configure-files.html)
```
aws configure --profile training-books
```

### Backend Setup

1. **Install AWS CDK CLI**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap AWS CDK**: Initialize your environment to use AWS CDK.
   ```bash
   cdk bootstrap
   ```

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

4. **Deploy the Backend**:
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
   - Open the environment file (`src/environments/environment.ts`).
   - Replace `STAGE` variable with the same variable you used in the back-end (i.e. your initials)

4. **Run the Development Server**:
   ```bash
   npm run start
   ```
   The application will be accessible at `http://localhost:8100/`.

## Deployment

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

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

### How to Contribute

1. Create a new branch (`git checkout -b feature-branch`).
2. Commit your changes (`git commit -m 'Add some feature'`).
3. Push to the branch (`git push origin feature-branch`).
4. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.