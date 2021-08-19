const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');

/**
 * Loads click data for Omeda deployment(s).
 *
 * If no data is found for a provided ID, it is omitted from the Map.
 *
 * @param {object} params
 * @param {string[]} params.trackIds
 * @param {object} tenant
 * @param {object} tenant.doc
 * @param {object} tenant.db
 * @param {object} tenant.omeda
 * @returns {Map} The deployment click data mapped by track ID.
 */
module.exports = async (params = {}, { omeda } = {}) => {
  const { trackIds } = await validateAsync(Joi.object({
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
  }), params);

  const ids = [...new Set(trackIds)];
  const items = await Promise.all(ids.map(async (trackId) => {
    const { data } = await omeda.resource('email').searchClicks({ trackId });
    if (!data) return null;
    const entity = omeda.entity.deployment({ trackId: data.TrackId });
    return {
      trackId,
      entity,
      data,
    };
  }));
  return items.filter((item) => item).reduce((map, item) => {
    map.set(item.trackId, item);
    return map;
  }, new Map());
};
