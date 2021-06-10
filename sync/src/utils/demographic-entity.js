const omeda = require('../omeda');
const entityId = require('./entity-id');

module.exports = ({ id } = {}) => entityId({
  brand: omeda.brand,
  type: 'demographic',
  id,
});
