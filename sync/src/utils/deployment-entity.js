const omeda = require('../omeda');
const entityId = require('./entity-id');

module.exports = ({ trackId } = {}) => entityId({
  brand: omeda.brand,
  type: 'deployment',
  id: trackId,
});
