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
- [x] fix `allExtractedUrlsForSend` and `searchExtractedUrlsForSend` queries
- [x] fix identity references in `excluded-email-domain` schema
- determine how to handle not-found customers
- [x] need to update `omeda-email-deployment-urls` when urls or hosts change
- [x] fix cache of extracted urls
- legacy excluded/inactive identity data needs to move to the new DB so the old DB can eventually be removed
- [ ] use https://www.omeda.com/knowledge-base/customer-change-lookup/ API for customer updates
- [x] drop behaviors - this can be done in onq now
- [ ] re-enable `Identity.inactiveCampaigns` and `Identity.inactiveLineItems` resolvers
- [ ] review campaign and line item resolvers
- [ ] handle `LineItem.formLineItemLeads` query, and `LineItem.formLineItemChoiceFilters,createFormLineItem` mutations
- [ ] restore `EmailCampaign.urls,hasEmailSends,urlCount,urlGroups`
- [ ] restore or move `emailReportService.buildEmailMetrics`
