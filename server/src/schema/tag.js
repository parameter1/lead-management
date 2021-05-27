const { Schema } = require('mongoose');
const importPlugin = require('../plugins/import');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { timestamps: true });

schema.plugin(importPlugin);

schema.index({ name: 1 }, {
  unique: true,
  partialFilterExpression: { deleted: false },
});
schema.index({ deleted: 1 });
schema.index({ name: 'text' });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
