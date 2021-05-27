const mongoose = require('../../mongoose');
const schema = require('../../schema/events/ad-creative');

module.exports = mongoose.model('event-ad-creative', schema);
