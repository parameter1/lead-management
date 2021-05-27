const mongoose = require('../mongoose');
const schema = require('../schema/url-acknowledgment');

module.exports = mongoose.model('url-acknowledgment', schema);
