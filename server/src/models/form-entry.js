const mongoose = require('../mongoose');
const schema = require('../schema/form-entry');

module.exports = mongoose.model('form-entry', schema);
