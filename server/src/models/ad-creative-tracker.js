const mongoose = require('../mongoose');
const schema = require('../schema/ad-creative-tracker');

module.exports = mongoose.model('ad-creative-tracker', schema);
