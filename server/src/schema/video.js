const { Schema } = require('mongoose');
const Customer = require('../models/customer');
const externalSourcePlugin = require('../plugins/external-source');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
  },

  body: {
    type: String,
  },

  duration: {
    type: Number,
  },

  publishedAt: {
    type: Date,
  },

  image: {
    type: String,
  },

  thumbnail: {
    type: String,
  },

  tags: {
    type: [String],
  },

  state: {
    type: String,
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
});

schema.index({ 'externalSource.createdAt': -1 });

schema.plugin(externalSourcePlugin, { required: true });

module.exports = schema;
