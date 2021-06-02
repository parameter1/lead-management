# Lead Management Monorepo

## Omeda Migration Notes
- need "click stream" api that can search for all click events during a certain date range
- need to determine which demographics (specifically business and title code) need to be used
- there are ALOT of deployment types (transferred from blasts, etc) -- which ones are going to be used?
- some newsletter products seem to be missing (specifically, only IEN newsletter products seem to exist)
- do list queries even exist yet for newsletters?
- need to establish custom merge variables for formstack forms, e.g. company name, city, state, zip, etc. See https://main.omeda.com/knowledge-base/email-merge-variables/
  - for now, temporary values were set (see the `extracted-urls` transformer in the `migrate` service)
  ```js
  [
    { key: 'Field2', value: '%%First Name%%' },
    { key: 'Field3', value: '%%Last Name%%' },
    { key: 'Field4', value: '%%emailaddr%%' },
    { key: 'Field7', value: '%%Company Name%%' },
    { key: 'Field5', value: '%%Title%%' },
    { key: 'Field8', value: '%%Phone Number%%' },
    { key: 'Field9', value: '%%Address%%' }
  ]
  ```
- need to determine if the deployment name can be included in merge vars
- fix ad creative trackers to use new customer IDs... see `graphql/resolvers/ad-creative-tracker.js`
- fix `allExtractedUrlsForSend` and `searchExtractedUrlsForSend` queries
- fix `allContentQueryResultRows` query
- fix identity references in `excluded-email-domain` schema
- determine how to handle not-found customers
- need to update `omeda-email-deployment-urls` when urls or hosts change
