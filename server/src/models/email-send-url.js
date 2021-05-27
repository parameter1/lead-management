const mongoose = require('../mongoose');
const schema = require('../schema/email-send-url');

module.exports = mongoose.model('email-send-url', schema);
