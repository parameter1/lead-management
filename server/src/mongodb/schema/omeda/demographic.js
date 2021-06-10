const { Schema } = require('mongoose');

const schema = new Schema({
  entity: { type: String },
  data: { type: Schema.Types.Mixed },
  lastRetrievedAt: { type: Date },
});

schema.index({ entity: 1 }, { unique: true });

module.exports = schema;
