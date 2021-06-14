const { Schema } = require('mongoose');

const schema = new Schema();

schema.index({ entity: 1 }, { unique: true });

module.exports = schema;
