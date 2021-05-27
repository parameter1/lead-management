const mongoose = require('../../mongoose');
const schema = require('../../schema/events/email-click');

module.exports = mongoose.model('event-email-click', schema);
