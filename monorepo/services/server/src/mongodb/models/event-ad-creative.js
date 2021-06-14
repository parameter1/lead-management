const connection = require('../connection');
const schema = require('../schema/event-ad-creative');

module.exports = connection.model('event-ad-creative', schema);
