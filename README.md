# Lead Management Monorepo

## Omeda Migration Notes
- [ ] need "click stream" api that can search for all click events during a certain date range
- [ ] need to determine if the deployment name can be included in merge vars
- [x] fix ad creative trackers to use new customer IDs... see `graphql/resolvers/ad-creative-tracker.js`
- [x] fix `allExtractedUrlsForSend` and `searchExtractedUrlsForSend` queries
- [x] fix identity references in `excluded-email-domain` schema
- determine how to handle not-found customers
- [x] need to update `omeda-email-deployment-urls` when urls or hosts change
- [x] fix cache of extracted urls
- legacy excluded/inactive identity data needs to move to the new DB so the old DB can eventually be removed
- [x] use https://www.omeda.com/knowledge-base/customer-change-lookup/ API for customer updates
- [x] drop behaviors - this can be done in onq now
- [x] re-enable `Identity.inactiveCampaigns` and `Identity.inactiveLineItems` resolvers
- [x] review campaign and line item resolvers
- [ ] handle `LineItem.formLineItemLeads` query, and `LineItem.formLineItemChoiceFilters,createFormLineItem` mutations
- [x] restore `EmailCampaign.urls,hasEmailSends,urlCount,urlGroups`
- [x] restore or move `emailReportService.buildEmailMetrics`
- [x] test new ad click/impression trackers
- [x] add meta tags to website for scraping companies/tags
- [x] do not cache indm websites when crawling

## Onboarding
1. Duplicate an existing namespace and reconfigure containers. Use new GAM, Omeda, Brightcove credentials
2. Add tenant to `lead-management.tenants` on Aquaria
3. Add permissions to LM user `db.grantRolesToUser('lead-management', [{ role: 'readWrite', db: 'lead-management-TENANTKEY' }])`
4. Generate DB/Indexes: Set tenant key and boot dev instance to auto-index
