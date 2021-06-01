const omeda = require('../client');
const entityId = require('./entity-id');

module.exports = ({ trackId } = {}) => entityId({
  brand: omeda.brand,
  type: 'deployment',
  id: trackId,
});
