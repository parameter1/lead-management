const { Schema } = require('mongoose');

const schema = new Schema({
  entity: { type: String },
  split: { type: Number },
  html: { type: String },
  lastRetrievedAt: { type: Date },
});

schema.index({ entity: 1, split: 1 }, { unique: true });

module.exports = schema;
