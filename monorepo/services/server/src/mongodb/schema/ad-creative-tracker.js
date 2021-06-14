const { Schema } = require('mongoose');
const connection = require('../connection');
const isURL = require('../../utils/is-url');

const schema = new Schema({
  description: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return isURL(v);
      },
      message: 'The provided URL is invalid {VALUE}',
    },
  },
  customerId: {
    type: Schema.Types.ObjectId,
    validate: {
      async validator(v) {
        if (!v) return true;
        const doc = await connection.model('customer').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No customer was found for {VALUE}',
    },
  },
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
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { timestamps: true });

schema.index({ deleted: 1 });
schema.index({ createdAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ customerId: 1 });

module.exports = schema;
