const { isURL } = require('validator');

module.exports = (v) => isURL(`${v}`, {
  protocols: ['http', 'https'],
  require_protocol: true,
});
