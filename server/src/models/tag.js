const mongoose = require('../mongoose');
const schema = require('../schema/tag');

module.exports = mongoose.model('tag', schema);
