const asyncRoute = require('../../utils/async-route');
const micro = require('../../micro');
const Campaign = require('../../mongodb/models/campaign');

module.exports = (app) => {
  app.get('/campaign/:hash/email/metrics', asyncRoute(async (req, res) => {
    const { hash } = req.params;
    const campaign = await Campaign.findByHash(hash);

    const csv = await micro.exports.request('campaign.emailMetrics', { hash });
    const filename = `${campaign.fullName} Email Metrics.csv`;
    res.header('content-type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  }));
};
