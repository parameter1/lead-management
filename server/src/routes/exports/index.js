const { Router } = require('express');
const noCache = require('nocache');

const asyncRoute = require('../../utils/async-route');
const micro = require('../../micro');
const Campaign = require('../../mongodb/models/campaign');

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

module.exports = router;
