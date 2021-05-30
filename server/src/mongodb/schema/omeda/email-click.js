const { Schema } = require('mongoose');

// this model is for indexing only.
const schema = new Schema({});

schema.index({
  urlId: 1,
  encryptedCustomerId: 1,
  trackId: 1,
  split: 1,
}, { unique: true });

module.exports = schema;
