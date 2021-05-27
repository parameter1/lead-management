const { Schema } = require('mongoose');
const externalSourcePlugin = require('../plugins/external-source');
const importPlugin = require('../plugins/import');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'email-category',
    required: true,
  },
  rollupMetrics: {
    type: Boolean,
    required: true,
    default: false,
  },
  isNewsletter: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

schema.plugin(importPlugin);
schema.plugin(externalSourcePlugin, { required: true });

schema.index({ name: 'text', subject: 'text' });

module.exports = schema;
