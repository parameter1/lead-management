const campaign = require('./campaign');
const identity = require('./identity');
const lineItem = require('./line-item');

module.exports = {
  ping: () => 'pong',
  campaign,
  identity,
  lineItem,
};
