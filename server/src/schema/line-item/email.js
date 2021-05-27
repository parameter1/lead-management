const { Schema } = require('mongoose');
const connection = require('../../mongoose');
const identityAttributes = require('../../services/identity-attributes');

const { isArray } = Array;

const identityFilterSchema = new Schema({
  key: {
    type: String,
  },
  label: {
    type: String,
  },
  matchType: {
    type: String,
    default: 'matches',
  },
  terms: {
    type: [String],
  },
});

const excludedUrlSchema = new Schema({
  urlId: {
    type: Schema.Types.ObjectId,
    validate: {
      async validator(v) {
        const doc = await connection.model('extracted-url').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No URL was found for {VALUE}',
    },
  },
  sendId: {
    type: Schema.Types.ObjectId,
    validate: {
      async validator(v) {
        const doc = await connection.model('email-send').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No email send was found for {VALUE}',
    },
  },
});

const schema = new Schema({
  categoryIds: [
    {
      type: Schema.Types.ObjectId,
      validate: {
        async validator(v) {
          const doc = await connection.model('email-category').findOne({ _id: v }, { _id: 1 });
          if (doc) return true;
          return false;
        },
        message: 'No email category was found for {VALUE}',
      },
    },
  ],
  tagIds: [
    {
      type: Schema.Types.ObjectId,
      validate: {
        async validator(v) {
          const doc = await connection.model('tag').findOne({ _id: v }, { _id: 1 });
          if (doc) return true;
          return false;
        },
        message: 'No tag was found for {VALUE}',
      },
    },
  ],
  excludedTagIds: [
    {
      type: Schema.Types.ObjectId,
      validate: {
        async validator(v) {
          const doc = await connection.model('tag').findOne({ _id: v }, { _id: 1 });
          if (doc) return true;
          return false;
        },
        message: 'No tag was found for {VALUE}',
      },
    },
  ],
  excludedFields: {
    type: [String],
    default: ['phoneNumber'],
    set: (v) => (isArray(v) ? v : ['phoneNumber']),
  },
  requiredFields: {
    type: [String],
    default: ['emailAddress'],
    set: (v) => (isArray(v) ? v : ['emailAddress']),
  },
  linkTypes: {
    type: [String],
    default: ['Advertising', '(Not Set)'],
    set: (v) => (isArray(v) ? v : ['Advertising', '(Not Set)']),
  },
  identityFilters: {
    type: [identityFilterSchema],
  },
  excludedUrls: {
    type: [excludedUrlSchema],
    default: () => [],
  },
});

schema.method('getExcludedFields', async function getEmailExcludedFields() {
  const isEditorial = this.get('linkTypes').includes('Editorial');
  const tag = await connection.model('tag').findOne({ _id: { $in: this.tagIds }, name: 'PR' });
  if (!tag && !isEditorial) return this.get('excludedFields');
  return identityAttributes.filter((attr) => !['title', 'companyName'].includes(attr.key)).map((attr) => attr.key);
});

module.exports = schema;
