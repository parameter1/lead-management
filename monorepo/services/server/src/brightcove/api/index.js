const analytics = require('./analytics');
const cms = require('./cms');

/** @type {BrightcoveApis} */
module.exports = { analytics, cms };

/**
 * @typedef BrightcoveApis
 * @prop {import("./analytics").BrightcoveAnalyticsApi} analytics
 * @prop {import("./cms").BrightcoveCMSApi} cms
 */
