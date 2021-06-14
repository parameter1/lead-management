const pattern = /lt\.lid=([a-f0-9]{24})/;

/**
 * Extracts the stringified URL ID for the provided link.
 *
 * @param {string} link
 * @returns {object}
 */
module.exports = (link) => {
  if (!link) return null;
  const matches = pattern.exec(link);
  if (!matches) return null;
  return matches[1] || null;
};
