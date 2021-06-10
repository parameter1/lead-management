const { Router } = require('express');
const noCache = require('nocache');

const campaignEmailMetrics = require('./campaign-email-metrics');

const router = Router();
router.use(noCache());

campaignEmailMetrics(router);

module.exports = router;
