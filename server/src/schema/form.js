const { Schema } = require('mongoose');
const externalSourceSchema = require('./external-source');
const WufooProvider = require('../services/wufoo-provider');
const importPlugin = require('../plugins/import');

const schema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'customer',
  },
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  previewUrl: {
    type: String,
    trim: true,
  },
  fields: {
    type: Schema.Types.Mixed,
    default: [],
  },
  externalSource: {
    type: externalSourceSchema,
    required: true,
  },
}, { timestamps: true });

schema.plugin(importPlugin);

schema.index({
  name: 'text',
  'externalSource.identifier': 'text',
});

schema.index({
  'externalSource.namespace': 1,
  'externalSource.identifier': 1,
}, {
  unique: true,
  partialFilterExpression: { externalSource: { $exists: true }, deleted: false },
});

schema.pre('save', async function setWufooData() {
  await WufooProvider.setFormFields(this);
});

module.exports = schema;
