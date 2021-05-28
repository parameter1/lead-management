const merge = require('lodash.merge');
const analytics = require('./analytics');
const cms = require('./cms');

module.exports = merge(
  analytics,
  cms,
);
