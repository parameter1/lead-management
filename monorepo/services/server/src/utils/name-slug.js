const { decode } = require('html-entities');
const slug = require('slug');

module.exports = (value) => {
  const decoded = decode(decodeURIComponent(value), { level: 'all' }).trim();
  return slug(decoded, { lower: true });
};
