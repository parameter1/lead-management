const { Schema } = require('mongoose');
const Juicer = require('url-juicer');
const shortid = require('shortid');
const Tag = require('../models/tag');
const Customer = require('../models/customer');
const ExtractedHost = require('../models/extracted-host');
const urlParamsPlugin = require('../plugins/url-params');
const importPlugin = require('../plugins/import');
const cleanUrl = require('../utils/clean-url');

const valuesSchema = new Schema({
  original: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator(v) {
        return Juicer.url.isValid(v);
      },
      message: 'The provided URL is invalid {VALUE}',
    },
    set: (v) => {
      if (!v) return v;
      try {
        return cleanUrl(v);
      } catch (e) {
        return '';
      }
    },
  },
  resolved: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator(v) {
        return Juicer.url.isValid(v);
      },
      message: 'The provided URL is invalid {VALUE}',
    },
    set: (v) => {
      if (!v) return v;
      try {
        return cleanUrl(v);
      } catch (e) {
        return '';
      }
    },
  },
}, { _id: false });

const metaSchema = new Schema({
  description: {
    type: String,
    trim: true,
  },
  openGraph: {
    type: Schema.Types.Mixed,
  },
}, { _id: false });

const schema = new Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    default() {
      return shortid.generate();
    },
  },
  title: {
    type: String,
    trim: true,
  },
  lastCrawledDate: {
    type: Date,
  },
  errorMessage: {
    type: String,
  },
  linkType: {
    type: String,
    required: true,
    default: '(Not Set)',
    enum: ['(Not Set)', 'Advertising', 'Editorial'],
  },
  values: {
    type: valuesSchema,
    required: true,
  },
  meta: {
    type: metaSchema,
  },
  resolvedHostId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await ExtractedHost.findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No extracted host was found for {VALUE}',
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

schema.index({ 'values.original': 1 }, { unique: true });
schema.index({ customerId: 1 });
schema.index({ resolvedHostId: 1 });
schema.index({ tagIds: 1 });

module.exports = schema;
