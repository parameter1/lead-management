const { Schema } = require('mongoose');
const { isFQDN } = require('validator');
const connection = require('../connection');
const urlParamsPlugin = require('../plugins/url-params');

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
});

schema.plugin(urlParamsPlugin);

schema.index({ customerId: 1 });

module.exports = schema;
