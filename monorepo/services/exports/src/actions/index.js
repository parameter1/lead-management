const campaign = require('./campaign');
const lineItem = require('./line-item');

module.exports = {
  ping: () => 'pong',
  campaign,
  lineItem,
};
