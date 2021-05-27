const { Schema } = require('mongoose');
const connection = require('../mongoose');
const importPlugin = require('../plugins/import');

const schema = new Schema({
  deploymentId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'email-deployment',
    validate: {
      async validator(v) {
        const doc = await connection.model('email-deployment').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No email deployment found for ID {VALUE}',
    },
  },
  sendId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'email-send',
    validate: {
      async validator(v) {
        const doc = await connection.model('email-send').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No email send found for ID {VALUE}',
    },
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'email-category',
  },
  sentDate: {
    type: Date,
    required: true,
  },
  isTestSend: {
    type: Boolean,
    required: true,
  },
  urlId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'extracted-url',
    validate: {
      async validator(v) {
        const doc = await connection.model('extracted-url').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No extracted URL found for ID {VALUE}',
    },
  },
  createdAt: {
    type: Date,
  },
});

schema.plugin(importPlugin);
schema.index({ sentDate: 1 });
schema.index({ sendId: 1, urlId: 1 }, { unique: true });

module.exports = schema;
