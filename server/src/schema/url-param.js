const { Schema } = require('mongoose');

const schema = new Schema({
  key: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    trim: true,
  },
}, {
  _id: false,
});

const mergeRegex = new RegExp('^%%');
schema.virtual('isMergeVar').get(function isMergeVar() {
  return mergeRegex.test(this.value);
});

schema.virtual('encodedValue').get(function encodedValue() {
  if (!this.isMergeVar) return encodeURIComponent(this.value);
  return this.value;
});

module.exports = schema;
