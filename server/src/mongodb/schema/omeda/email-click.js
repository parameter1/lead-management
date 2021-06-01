const { Schema } = require('mongoose');

// this model is for indexing only.
const schema = new Schema({});

schema.index({
  url: 1,
  idt: 1,
  dep: 1,
  split: 1,
}, { unique: true });

module.exports = schema;
