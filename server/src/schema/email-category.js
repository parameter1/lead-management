const { Schema } = require('mongoose');
const externalSourcePlugin = require('../plugins/external-source');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'email-category',
  },
  hasDeployments: {
    type: Boolean,
    required: true,
    default: false,
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

schema.plugin(externalSourcePlugin, { required: true });

schema.index({ name: 'text', fullName: 'text' });
schema.index({ parentId: 1 });
schema.index({ hasDeployments: 1 });
schema.index({ fullName: 1, _id: 1 }, { unique: true });
schema.index({ fullName: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
