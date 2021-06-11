const { Router } = require('express');
const noCache = require('nocache');
const { Parser } = require('json2csv');

const asyncRoute = require('../../utils/async-route');
const micro = require('../../micro');
const Campaign = require('../../mongodb/models/campaign');
const emailDeploymentReportService = require('../../services/email-deployment-report');

const router = Router();
router.use(noCache());

const doExport = async (res, { hash, action, name }) => {
  const campaign = await Campaign.findByHash(hash);
  const csv = await micro.exports.request(action, { hash });
  const filename = `${campaign.fullName} ${name}.csv`;
  res.header('content-type', 'text/csv');
  res.attachment(filename);
  res.send(csv);
};

router.get('/campaign/:hash/leads', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  await doExport(res, { hash, action: 'campaign.emailLeads', name: 'Email Leads' });
}));

router.get('/campaign/:hash/email/metrics', asyncRoute(async (req, res) => {
  const { hash } = req.params;
  await doExport(res, { hash, action: 'campaign.emailMetrics', name: 'Email Metrics' });
}));

router.get('/email-deployment-report', asyncRoute(async (req, res) => {
  const start = new Date(parseInt(req.query.start, 10));
  const end = new Date(parseInt(req.query.end, 10));

  const rows = await emailDeploymentReportService.export({ start, end });

  let csv;
  if (rows.length) {
    const parser = new Parser({
      fields: Object.keys(rows[0]),
    });
    csv = parser.parse(rows);
  }
  const filename = 'Email Deployment Report.csv';
  res.header('content-type', 'text/csv');
  res.attachment(filename);
  res.send(csv);
}));

module.exports = router;
