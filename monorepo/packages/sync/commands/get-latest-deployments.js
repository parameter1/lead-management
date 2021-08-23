const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');
const dayjs = require('../dayjs');

module.exports = async (params = {}) => {
  const { tenantKey } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
  }).required(), params);

  const { db } = await loadTenant({ key: tenantKey });
  // find all deployments in the leads database over the last 7 days...
  const onOrAfter = dayjs().subtract(7, 'days').toDate();
  const trackIds = await db.collection('omeda-email-deployments').distinct('omeda.TrackId', {
    'omeda.Status': { $in: ['Sent', 'Sending'] },
    'omeda.SentDate': { $gte: onOrAfter },
  });
  return trackIds;
};
