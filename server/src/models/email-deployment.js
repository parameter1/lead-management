const mongoose = require('../mongoose');
const schema = require('../schema/email-deployment');

module.exports = mongoose.model('email-deployment', schema);
