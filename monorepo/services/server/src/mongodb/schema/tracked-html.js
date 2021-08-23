const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  date: { type: Date },
  userId: { type: Schema.Types.ObjectId },
  original: { type: String },
  processed: { type: String },
}, {
  timestamps: true,
});

/**
 * Indexes
 */
schema.index({ date: 1 });
schema.index({ userId: 1 });

module.exports = schema;
