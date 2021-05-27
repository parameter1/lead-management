const mongoose = require('../mongoose');
const schema = require('../schema/ad-creative');

module.exports = mongoose.model('ad-creative', schema);
