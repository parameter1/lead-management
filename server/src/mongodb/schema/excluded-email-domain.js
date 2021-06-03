const { Schema } = require('mongoose');
const validator = require('validator');
const escapeRegex = require('escape-string-regexp');
const connection = require('../connection');

const schema = new Schema({
  domain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: [
      {
        validator(domain) {
          if (!domain) return true;
          return validator.isFQDN(domain);
        },
        message: 'Invalid domain name {VALUE}',
      },
    ],
  },
}, { timestamps: true });

schema.index({ domain: 1 }, { unique: true });

schema.pre('save', async function setInactiveIdentites() {
  const { domain } = this;
  const regex = new RegExp(`${escapeRegex(domain)}$`, 'i');
  await connection.model('identity').updateMany({ emailAddress: regex }, { $set: { domainExcluded: true } });
});

schema.pre('remove', async function unsetInactiveIdentities() {
  const { domain } = this;
  const regex = new RegExp(`${escapeRegex(domain)}$`, 'i');
  await connection.model('identity').updateMany({ emailAddress: regex }, { $set: { domainExcluded: false } });
});

module.exports = schema;
