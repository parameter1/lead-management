const { Schema } = require('mongoose');

const schema = new Schema({
  dep: { type: String },
  idt: { type: String },
  split: { type: String },
  url: { type: Schema.Types.ObjectId },
  date: { type: Date },
  n: { type: Number },
});

schema.index({
  url: 1,
  idt: 1,
  dep: 1,
  split: 1,
}, { unique: true });

module.exports = schema;
