const entityId = require('./index');

module.exports = ({ trackId } = {}) => entityId({
  type: 'deployment',
  id: trackId,
});
