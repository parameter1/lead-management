const mongoose = require('../../mongoose');
const schema = require('../../schema/behavior/view');

module.exports = mongoose.model('behavior-view', schema);
