const { Schema } = require('mongoose');
const { TENANT_KEY } = require('../../env');

const schema = new Schema({
  action: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'running', 'completed', 'errored'],
  },
  key: String,
  errorMessage: String,
}, { timestamps: true });

schema.pre('save', async function setKey() {
  this.key = `exports/${TENANT_KEY}/${this.campaign}/${this.filename}`;
});

module.exports = schema;
