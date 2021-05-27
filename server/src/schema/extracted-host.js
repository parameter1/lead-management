const { Schema } = require('mongoose');
const { isFQDN } = require('validator');
const Tag = require('../models/tag');
const Customer = require('../models/customer');
const urlParamsPlugin = require('../plugins/url-params');
const importPlugin = require('../plugins/import');

const schema = new Schema({
  value: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate: {
      validator: isFQDN,
      message: '{VALUE} is an invalid host name.',
    },
  },
  customerId: {
    type: Schema.Types.ObjectId,
    validate: {
      async validator(v) {
        if (!v) return true;
        const doc = await Customer.findOne({ _id: v }, { _id: 1 });
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
          const doc = await Tag.findOne({ _id: v }, { _id: 1 });
          if (doc) return true;
          return false;
        },
        message: 'No tag was found for {VALUE}',
      },
    },
  ],
});

schema.plugin(importPlugin);
schema.plugin(urlParamsPlugin);

schema.index({ customerId: 1 });

module.exports = schema;
