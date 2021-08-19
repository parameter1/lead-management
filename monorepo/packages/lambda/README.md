## Function Overview

- `enqueue-deployment-data`
  - runs from an EventBridge trigger every X minutes
  - finds all email deployments in the database over the last seven days
  - pushes the deployment `trackIds` to the `deployment-data` SQS queue

- `poll-deployments`
  - runs from an EventBridge trigger every X minutes
  - finds the most recently sent email deployment in the database
  - uses the last deployment sent date (or default date of the last 30 days) to find all email deployment `trackIds` since that date
  - all found `trackIds` are directly upserted in the database

- `process-brand-data`
  - runs from an EventBridge trigger every X hours
  - upserts the Omeda comprehensive brand data in the database

- `process-customers`
  - reads from the `customer-ids` SQS queue
  - reduces the queue records into a set of `encryptedCustomerIds`
  - immediately "scaffolds" the IDs as customer records in the database

- `process-deployment-data`
  - reads from the `deployment-data` SQS queue
  - reduces the queue records into a set of deployment `trackIds`
  - upserts the deployment clicks and metrics for the `trackIds` in the database
  - extracts `encryptedCustomerIds` and `identityRecords` from all deployment clicks
  - enqueues the `encryptedCustomerIds` and `identityRecords` to the `customer-ids` and `identity-records` SQS queues, respectively

- `process-identity-records`
  - reads from the `identity-records` SQS queue
  - upserts the records to the database (these records are calculated and do not use an Omeda ID)

- `upsert-scaffolded-customers`
  - runs from an EventBridge trigger every X minutes
  - finds all identity records in the database flagged as scaffolded and does a full record upsert from Omeda
