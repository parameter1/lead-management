const { Schema } = require('mongoose');
const externalSourcePlugin = require('../plugins/external-source');
const EmailDeployment = require('../models/email-deployment');
const emailMetricsSchema = require('./email-metrics');
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
  isTestSend: {
    type: Boolean,
    default: false,
    required: true,
  },
  deploymentId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await EmailDeployment.findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No email deployment found for ID {VALUE}',
    },
  },
  sentDate: {
    type: Date,
  },
  fromName: {
    type: String,
    trim: true,
  },
  fromEmail: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    trim: true,
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
  metrics: {
    type: emailMetricsSchema,
    required: true,
  },
}, { timestamps: true });

schema.plugin(importPlugin);
schema.plugin(externalSourcePlugin, { required: true });

schema.index({ isTestSend: 1, deploymentId: 1 });
schema.index({ name: 'text', subject: 'text' });
schema.index({ deploymentId: 1 });

schema.index({ sentDate: 1, _id: 1 }, { unique: true });
schema.index({ sentDate: -1, _id: -1 }, { unique: true });

module.exports = schema;
