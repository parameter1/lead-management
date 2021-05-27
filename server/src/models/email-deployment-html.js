const mongoose = require('../mongoose');
const schema = require('../schema/email-deployment-html');

module.exports = mongoose.model('email-deployment-html', schema, 'email-deployment-html');
