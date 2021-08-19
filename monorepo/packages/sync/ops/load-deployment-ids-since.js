const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const dayjs = require('../dayjs');

/**
 * Gets all sent or sending deployment IDs since/after a certain date.
 *
 * @param {object} params
 * @param {Date} params.onOrAfter
 * @param {number} [params.clockDriftMinutes=60]
 * @param {object} tenant
 * @param {object} tenant.doc
 * @param {object} tenant.db
 * @param {object} tenant.omeda
 * @returns {string[]}
 */
module.exports = async (params = {}, { omeda } = {}) => {
  const { onOrAfter, clockDriftMinutes } = await validateAsync(Joi.object({
    onOrAfter: Joi.date().required(),
    clockDriftMinutes: Joi.number().min(0).default(60),
  }), params);

  const start = dayjs(onOrAfter).subtract(clockDriftMinutes, 'minutes').toDate();
  const { data } = await omeda.resource('email').searchDeployments({
    deploymentDateStart: start,
    numResults: 1000,
    statuses: ['SENT_OR_SENDING'],
  });
  return data.map(({ TrackId }) => TrackId);
};
