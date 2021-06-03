const { Schema } = require('mongoose');

const getEmailDomain = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  return parts[1].trim().toLowerCase();
};

const schema = new Schema({
  entity: { type: String, required: true },
  inactive: { type: Boolean, default: false },
  inactiveCustomerIds: [{ type: Schema.Types.ObjectId }],
  inactiveCampaignIds: [{ type: Schema.Types.ObjectId }],
  inactiveLineItemIds: [{ type: Schema.Types.ObjectId }],
  attributes: { type: Schema.Types.Mixed, default: () => ({}) },
  givenName: { type: String, trim: true, default: '' },
  familyName: { type: String, trim: true, default: '' },
  title: { type: String, trim: true, default: '' },
  companyName: { type: String, trim: true, default: '' },
  fieldCount: { type: Number, default: 0 },
  emailAddress: {
    type: String,
    lowercase: true,
    trim: true,
    default: '',
  },
  emailDomain: { type: String, default() { return getEmailDomain(this.emailAddress); } },
  domainExcluded: { type: Boolean, default: false },
  phoneNumber: { type: String, trim: true, default: '' },
  street: { type: String, trim: true, default: '' },
  streetExtra: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  region: { type: String, trim: true, default: '' },
  postalCode: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  lastRetrievedAt: { type: Date },
}, { timestamps: true });

schema.index({ entity: 1 }, { unique: true });
schema.index({ fieldCount: 1, _id: 1 }, { unique: true });
schema.index({ region: 1, _id: 1 }, { unique: true });
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
