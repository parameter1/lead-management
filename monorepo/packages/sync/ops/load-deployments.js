const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');

/**
 * Loads Omeda deployment(s).
 *
 * @param {object} params
 * @param {string} params.trackIds
 * @param {object} tenant
 * @param {object} tenant.doc
 * @param {object} tenant.db
 * @param {object} tenant.omeda
 * @returns {Map} The deployments mapped by track ID.
 */
module.exports = async (params = {}, { omeda } = {}) => {
  const { trackIds } = await validateAsync(Joi.object({
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
  }), params);

  const ids = [...new Set(trackIds)];
  const items = await Promise.all(ids.map(async (trackId) => {
    const { data } = await omeda.resource('email').lookupDeploymentById({ trackId });
    const entity = omeda.entity.deployment({ trackId: data.TrackId });
    return {
      trackId,
      entity,
      data,
    };
  }));
  return items.reduce((map, item) => {
    map.set(item.trackId, item);
    return map;
  }, new Map());
};
