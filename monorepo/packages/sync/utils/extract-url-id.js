const patterns = [
  /lt\.lid=([a-f0-9]{24})/,
  /&lt;\.lid=([a-f0-9]{24})/,
  /__lt-lid=([a-f0-9]{24})/,
];

/**
 * Extracts the stringified URL ID for the provided link.
 *
 * @param {string} link
 * @returns {object}
 */
module.exports = (link) => {
  if (!link) return null;
  const matches = patterns.reduce((found, pattern) => {
    if (found) return found;
    return pattern.exec(link);
  }, null);
  if (!matches) return null;
  return matches[1] || null;
};
