const entityId = require('./index');

module.exports = ({ id } = {}) => entityId({
  type: 'demographic',
  id,
});
