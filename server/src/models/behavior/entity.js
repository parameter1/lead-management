const mongoose = require('../../mongoose');
const schema = require('../../schema/behavior/entity');

module.exports = mongoose.model('behavior-entity', schema);
