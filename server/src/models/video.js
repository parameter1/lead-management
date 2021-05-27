const mongoose = require('../mongoose');
const schema = require('../schema/video');

module.exports = mongoose.model('video', schema);
