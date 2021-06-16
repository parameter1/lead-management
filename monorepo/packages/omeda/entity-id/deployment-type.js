const entityId = require('./index');

module.exports = ({ id } = {}) => entityId({
  type: 'deployment-type',
  id,
});
