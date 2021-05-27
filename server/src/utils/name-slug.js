const { AllHtmlEntities } = require('html-entities');
const slug = require('slug');

const entities = new AllHtmlEntities();

module.exports = (value) => {
  const decoded = entities.decode(decodeURIComponent(value)).trim();
  return slug(decoded, { lower: true });
};
