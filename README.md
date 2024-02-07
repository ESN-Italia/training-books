# CommIT workshop Fəb 2023

- [DynamoDB guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)

# How to sətup

This workshop may be deployed via 2 different ways: CDK or Pulumi.
You may choose the one you prefer between the two (but not both together, as they are built on 2 different technologies).

## Pulumi

First of all it is needed to install and sətup pulumi.
You can find the how-to guide at this link: https://www.pulumi.com/docs/install/

Then, to sətup the workshop please launch the following commands:

- npm i
- pulumi up
- Go to `<create a new stack>` and press Enter
- As stack name, put `workshop`
- Go to `yes` and press Enter

If everything worked, `Outputs` should display an url: clicking on it will call the 'display book' API, that
should return `[]` (since the array is empty as for now).
