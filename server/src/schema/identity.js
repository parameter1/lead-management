const { Schema } = require('mongoose');
const validator = require('validator');
const externalSourcePlugin = require('../plugins/external-source');
const importPlugin = require('../plugins/import');

const getEmailDomain = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  return parts[1].trim().toLowerCase();
};

const schema = new Schema({
  inactive: {
    type: Boolean,
    default: false,
  },
  inactiveCustomerIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'customer',
    },
  ],
  inactiveCampaignIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'campaign',
    },
  ],
  inactiveLineItemIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'line-item',
    },
  ],
  attributes: {
    type: Schema.Types.Mixed,
    set(v) {
      return v && typeof v === 'object' ? v : {};
    },
  },
  givenName: {
    type: String,
    trim: true,
    default: '',
  },
  familyName: {
    type: String,
    trim: true,
    default: '',
  },
  title: {
    type: String,
    trim: true,
    default: '',
  },
  companyName: {
    type: String,
    trim: true,
    default: '',
  },
  fieldCount: {
    type: Number,
    default: 0,
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    validate: [
      {
        validator(email) {
          if (!email) return true;
          return validator.isEmail(email);
        },
        message: 'Invalid email address {VALUE}',
      },
    ],
  },
  emailDomain: {
    type: String,
    default() {
      return getEmailDomain(this.emailAddress);
    },
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: '',
  },
  street: {
    type: String,
    trim: true,
    default: '',
  },
  streetExtra: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  region: {
    type: String,
    trim: true,
    default: '',
  },
  postalCode: {
    type: String,
    trim: true,
    default: '',
  },
  country: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

schema.plugin(importPlugin);
schema.plugin(externalSourcePlugin, { required: false });

schema.index({ fieldCount: 1, _id: 1 }, { unique: true });
schema.index({ fieldCount: -1, _id: -1 }, { unique: true });
// @todo There appears to be issues if users do not have a region value
// Need to ensure strings, values have a value, not undefined.
schema.index({ region: 1, _id: 1 }, { unique: true });
schema.index({ region: -1, _id: -1 }, { unique: true });

schema.index({ emailAddress: 1 });

schema.index({ inactive: 1 });
schema.index({ inactiveCustomerIds: 1 });
schema.index({ inactiveCampaignIds: 1 });

schema.pre('save', function calcFieldCount(done) {
  let count = 0;
  const keys = ['givenName', 'familyName', 'title', 'companyName', 'emailAddress', 'phoneNumber', 'street', 'city', 'region', 'postalCode', 'country'];
  keys.forEach((key) => {
    if (this.get(key)) count += 1;
  });
  if (this.attributes) {
    Object.keys(this.attributes).forEach((key) => {
      if (this.get(`attributes.${key}`)) count += 1;
    });
  }
  this.fieldCount = count;
  done();
});

schema.pre('save', function setEmailDomain() {
  this.emailDomain = getEmailDomain(this.emailAddress);
});

module.exports = schema;
