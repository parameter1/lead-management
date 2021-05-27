const mongoose = require('../mongoose');
const schema = require('../schema/excluded-email-domain');

module.exports = mongoose.model('excluded-email-domain', schema);
