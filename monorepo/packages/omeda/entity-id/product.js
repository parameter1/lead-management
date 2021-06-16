const entityId = require('./index');

module.exports = ({ id } = {}) => entityId({
  type: 'product',
  id,
});
