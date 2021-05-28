const noCase = require('no-case');

/**
 * Casts an incoming value as a string.
 *
 * @param {string} v
 */
const stringify = (v) => {
  if (v === undefined || v === null || Number.isNaN(v)) return undefined;
  const cast = String(v).trim();
  return cast.length ? cast : undefined;
};

module.exports = {
  stringify,
  dasherize(v) {
    const cast = stringify(v);
    return cast ? noCase(cast, null, '-') : cast;
  },
};
