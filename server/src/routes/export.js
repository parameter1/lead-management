require('csv-express');
const noCache = require('nocache');
const moment = require('moment-timezone');
const { Router } = require('express');

// @todo this entire file should be split into micro-services and use graphql directly.

const identityAttributes = require('../services/identity-attributes');
const Campaign = require('../models/campaign');
const ContentQueryResult = require('../models/content-query/result');
const EmailSend = require('../models/email-send');
const EmailLineItem = require('../models/line-item/email');
const FormLineItem = require('../models/line-item/form');
const Form = require('../models/form');
const EventEmailClick = require('../models/events/email-click');
const ExtractedUrl = require('../models/extracted-url');
const FormEntry = require('../models/form-entry');
const Order = require('../models/order');
const FormRepo = require('../repos/form');
const Identity = require('../models/identity');
const asyncRoute = require('../utils/async-route');
const emailReportService = require('../services/email-report');
const emailLineItemReportService = require('../services/line-item/email-report');
const adReportService = require('../services/ad-report');
const identityService = require('../services/identity-provider');
const { eachSeriesPromise, parallelPromise } = require('../utils/async');
const { Query: leadReportResolvers, ReportEmailMetricTotals } = require('../graphql/resolvers/lead-report');
const { FormEntry: formEntryResolvers } = require('../graphql/resolvers/form-entry');
const { EmailSendMetrics } = require('../graphql/resolvers/email-send');
const emailDeploymentReportService = require('../services/email-deployment-report');

const router = Router();
router.use(noCache());

const identityFields = Object.values(identityService.getIdentityAttrMap());

router.get('/campaign/:hash/leads', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  const campaign = await Campaign.findByHash(hash);
  const { email } = campaign;
  const excludeFields = await email.getExcludeFields();

  const pipeline = await emailReportService.buildExportPipeline(campaign);
  const result = await EventEmailClick.aggregate(pipeline);

  const identityIds = result.map((r) => r._id);
  const identities = await Identity.find({ _id: { $in: identityIds } })
    .collation({ locale: 'en_US' })
    .sort({ fieldCount: -1, _id: -1 });

  const fields = identityFields.filter((key) => !excludeFields.includes(key));

  const rows = [];
  await eachSeriesPromise(identities, async (identity) => {
    const r = result.find((o) => `${o._id}` === `${identity.id}`);
    const { urls, sends } = await parallelPromise({
      urls: async () => ExtractedUrl.find({ _id: { $in: r.urlIds } }, { 'values.resolved': 1 }),
      sends: async () => EmailSend.find({ _id: { $in: r.sendIds } }, { sentDate: 1, name: 1 }),
    });
    const row = fields.reduce((acc, key) => {
      const value = identity.get(key);
      const display = identityAttributes.find((attr) => attr.key === key);
      return { ...acc, [display.label]: value };
    }, {});
    row.URLs = urls.map((d) => d.get('values.resolved')).join(', ');
    row.Deployments = sends.map((d) => `${d.name} (Sent: ${d.sentDate})`).join(', ');
    row.Clicks = r.clicks;

    rows.push(row);
  });

  const filename = `${campaign.fullName} Email Leads.csv`;
  res.attachment(filename);
  res.csv(rows, true);
}));

router.get('/campaign/:hash/email/metrics', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  const campaign = await Campaign.findByHash(hash);
  const sort = {
    field: 'sentDate',
    order: 1,
  };
  const results = await leadReportResolvers.reportEmailMetrics(null, { hash, sort });
  const rows = results.map((row) => {
    const { send } = row;
    const { metrics } = send;
    return {
      Name: send.name,
      Date: moment.tz(send.sentDate, 'America/Chicago').format('MMM Do, YYYY HH:mm a'),
      'Unique Opens': metrics.uniqueOpens,
      'Unique Clicks': metrics.uniqueClicks,
      'Open Rate': EmailSendMetrics.openRate(metrics) * 100,
      CTOR: EmailSendMetrics.clickToOpenRate(metrics) * 100,
      CTR: EmailSendMetrics.clickToDeliveredRate(metrics) * 100,
      'Advertiser CTR': row.advertiserClickRate * 100,
      'Total Ad Clicks per Day': row.clicks,
      'Total Unique Clicks': row.identities,
      'Preview URL': send.url,
    };
  });
  const totals = ReportEmailMetricTotals.metrics(results);
  rows.push({
    Name: `Total Emails: ${ReportEmailMetricTotals.sends(results)}`,
    Date: '',
    'Unique Opens': totals.uniqueOpens,
    'Unique Clicks': totals.uniqueClicks,
    'Open Rate': EmailSendMetrics.openRate(totals) * 100,
    CTOR: EmailSendMetrics.clickToOpenRate(totals) * 100,
    CTR: EmailSendMetrics.clickToDeliveredRate(totals) * 100,
    'Advertiser CTR': ReportEmailMetricTotals.advertiserClickRate(results) * 100,
    'Total Ad Clicks per Day': ReportEmailMetricTotals.clicks(results),
    'Total Unique Clicks': ReportEmailMetricTotals.identities(results),
    'Preview URL': '',
  });

  const filename = `${campaign.fullName} Email Metrics.csv`;
  res.attachment(filename);
  res.csv(rows, true);
}));

router.get('/line-item/:hash/email/leads', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  const lineitem = await EmailLineItem.findByHash(hash);
  const [order, excludedFields] = await Promise.all([
    Order.findById(lineitem.orderId),
    lineitem.getExcludedFields(),
  ]);

  // @todo this is slow. fix me!
  const pipeline = await emailLineItemReportService.buildExportPipeline(lineitem);
  const result = await EventEmailClick.aggregate(pipeline);

  const identityIds = result.map((r) => r._id);
  const identities = await Identity.find({ _id: { $in: identityIds } })
    .collation({ locale: 'en_US' })
    .sort({ fieldCount: -1, _id: -1 });

  const fields = identityFields.filter((key) => !excludedFields.includes(key));

  const rows = [];
  await eachSeriesPromise(identities, async (identity) => {
    const r = result.find((o) => `${o._id}` === `${identity.id}`);
    const { urls, sends } = await parallelPromise({
      urls: async () => ExtractedUrl.find({ _id: { $in: r.urlIds } }, { 'values.resolved': 1 }),
      sends: async () => EmailSend.find({ _id: { $in: r.sendIds } }, { sentDate: 1, name: 1 }),
    });
    const row = fields.reduce((acc, key) => {
      const value = identity.get(key);
      const display = identityAttributes.find((attr) => attr.key === key);
      return { ...acc, [display.label]: value };
    }, {});
    row.URLs = urls.map((d) => d.get('values.resolved')).join(', ');
    row.Deployments = sends.map((d) => `${d.name} (Sent: ${d.sentDate})`).join(', ');
    row.Clicks = r.clicks;

    rows.push(row);
  });

  const filename = `${order.name} - ${lineitem.name} Email Leads.csv`;
  res.attachment(filename);
  res.csv(rows, true);
}));

router.get('/line-item/:hash/form/leads', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  const lineItem = await FormLineItem.findByHash(hash);
  const [order, form] = await Promise.all([
    Order.findById(lineItem.orderId),
    Form.findById(lineItem.formId),
  ]);

  const criteria = await FormRepo.buildEntryCriteriaFor(form, {
    suppressInactives: true,
    refreshEntries: true,
    max: lineItem.requiredLeads,
    startDate: lineItem.get('range.start'),
    endDate: lineItem.get('range.end'),
    choiceFilters: lineItem.choiceFilters,
  });

  const entries = await FormEntry.find(criteria);
  const formattedEntries = await Promise.all(entries.map(async (entry) => {
    const ctx = { form };
    return formEntryResolvers.wufooValues(entry, null, ctx);
  }));

  const rows = formattedEntries.map((entry) => {
    const row = entry.reduce((o, { field, value }) => {
      const v = value == null ? '' : value;
      const { Title } = field;
      return { ...o, [Title.replace(',', '')]: v };
    }, {});
    return row;
  });
  const filename = `${order.name} - ${lineItem.name} Form Leads.csv`;
  res.attachment(filename);
  res.csv(rows, true);
}));

router.get('/campaign/:hash/ad-leads', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  const campaign = await Campaign.findByHash(hash);
  const { ads } = campaign;
  const excludeFields = ads.excludeFields || [];

  const identityIds = await adReportService.getEligibleIdentityIds(campaign);
  const projection = await adReportService.identityFieldProjection(campaign);

  const identities = await Identity.find({ _id: { $in: identityIds } }, projection)
    .sort({ fieldCount: -1, _id: -1 });
  const fields = identityFields.filter((key) => !excludeFields.includes(key));

  const rows = [];
  identities.forEach((identity) => {
    const row = fields.reduce((acc, key) => {
      const value = identity.get(key);
      const display = identityAttributes.find((attr) => attr.key === key);
      return { ...acc, [display.label]: value };
    }, {});
    rows.push(row);
  });

  const filename = `${campaign.fullName} Ad Campaign Leads.csv`;
  res.attachment(filename);
  res.csv(rows, true);
}));

router.get('/behavior/:id', asyncRoute(async (req, res) => {
  const { id } = req.params;
  const queryResult = await ContentQueryResult.findById(id);
  if (!queryResult) throw new Error(`No query result found for ID '${id}'`);
  const { identityIds } = queryResult;

  const identities = await Identity.find({
    _id: { $in: identityIds },
  }, { _id: 0, emailAddress: 1 }).sort({ emailAddress: 1 }).lean();

  res.attachment('behavior-query-results.csv');
  res.csv(identities, true);
}));

router.get('/campaign/:hash/form-entries/:formId', asyncRoute(async (req, res) => {
  const { formId, hash } = req.params;
  const campaign = await Campaign.findByHash(hash);
  const { maxIdentities, startDate, endDate } = campaign;

  const form = await FormRepo.findById(formId);

  const criteria = await FormRepo.buildEntryCriteriaFor(form, {
    suppressInactives: true,
    max: maxIdentities,
    startDate,
    endDate,
  });

  const entries = await FormEntry.find(criteria).sort({ identifier: 1 });
  const fields = form.fields.filter((field) => {
    const id = field.ID || '';
    return id.indexOf('Field') === 0;
  });

  const formatted = entries.map((entry) => {
    const values = entry.values || {};
    return fields.reduce((acc, field) => {
      const value = values[field.ID];
      return { ...acc, [field.Title]: value };
    }, {});
  });

  const filename = `${form.name} Form Leads.csv`;
  res.attachment(filename);
  res.csv(formatted, true);
}));

router.get('/email-deployment-report', asyncRoute(async (req, res) => {
  const start = new Date(parseInt(req.query.start, 10));
  const end = new Date(parseInt(req.query.end, 10));

  const rows = await emailDeploymentReportService.export({ start, end });
  const filename = 'Email Deployment Report.csv';
  res.attachment(filename);
  res.csv(rows, true);
}));

module.exports = router;
