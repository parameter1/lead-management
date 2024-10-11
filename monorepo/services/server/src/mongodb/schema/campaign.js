const { Schema } = require('mongoose');
const dayjs = require('../../dayjs');
const hashablePlugin = require('../plugins/hashable');
const connection = require('../connection');
const redis = require('../../redis');
const newrelic = require('../../newrelic');
const identityAttributes = require('../../services/identity-attributes');

const createDate = (value) => dayjs.tz(value, 'America/Chicago');

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

/**
 *
 */
const excludeUrlSchema = new Schema({
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
  deploymentEntity: {
    type: String,
    validate: {
      async validator(v) {
        const doc = await connection.model('omeda-email-deployment').findOne({ entity: v }, { entity: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No email deployment was found for {VALUE}',
    },
  },
});

/**
 * @todo temporarily disable forms
 */
// const formsSchema = new Schema({
//   enabled: {
//     type: Boolean,
//     required: true,
//     default: true,
//   },
//   excludeFormIds: [{
//     type: Schema.Types.ObjectId,
//     ref: 'form',
//   }],
// });

const adMetricsSchema = new Schema({
  enabled: {
    type: Boolean,
    required: true,
    default: true,
  },
  excludedGAMLineItemIds: {
    type: [String],
    default: [],
  },
});

const videoMetricsSchema = new Schema({
  enabled: {
    type: Boolean,
    required: true,
    default: true,
  },
  excludedBrightcoveVideoIds: {
    type: [String],
    default: [],
  },
});

const adsSchema = new Schema({
  enabled: {
    type: Boolean,
    required: true,
    default: true,
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
  excludeFields: {
    type: [String],
    default: ['phoneNumber'],
  },
  identityFilters: {
    type: [identityFilterSchema],
  },
  excludeTrackerIds: {
    type: [Schema.Types.ObjectId],
  },
});

/**
 * @typedef EmailCampaignClickRule
 * @prop {number} [seconds]
 * @prop {import("../../utils/email-clicks").UnrealClickCode} [allowUnrealCodes]
 */
const clickRulesSchema = new Schema({
  seconds: {
    type: Number,
    default: 0,
    required: true,
  },
  allowUnrealCodes: {
    type: [Number],
    default: () => [],
  },
});

const emailSchema = new Schema({
  clickRules: [
    { type: clickRulesSchema },
  ],
  enabled: {
    type: Boolean,
    required: true,
    default: true,
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
  excludeFields: {
    type: [String],
    default: ['phoneNumber', 'last'],
  },
  allowedLinkTypes: {
    type: [String],
    default: ['Advertising', '(Not Set)'],
  },
  identityFilters: {
    type: [identityFilterSchema],
  },
  excludeUrls: {
    type: [excludeUrlSchema],
  },
  restrictToSentDate: {
    type: Boolean,
    default: true,
  },
  displayDeliveredMetrics: {
    type: Boolean,
    default: true,
  },
  enforceMaxEmailDomains: {
    type: Boolean,
    default() {
      return this.isNew;
    },
  },
});

emailSchema.method('getExcludeFields', async function getEmailExcludeFields() {
  const isEditorial = this.get('allowedLinkTypes').includes('Editorial');
  const tag = await connection.model('tag').findOne({ _id: { $in: this.tagIds }, name: 'PR' }, { _id: 1 });
  if (!tag && !isEditorial) return this.get('excludeFields');
  return identityAttributes.filter((attr) => !['title', 'companyName'].includes(attr.key)).map((attr) => attr.key);
});

const schema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'customer',
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('customer').findById(v, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No customer found for ID {VALUE}',
    },
  },
  salesRepId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    validate: {
      async validator(v) {
        const doc = await connection.model('user').findById(v, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No user found for ID {VALUE}',
    },
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
    set: (v) => createDate(v).startOf('day').toDate(),
  },
  endDate: {
    type: Date,
    required: true,
    set: (v) => createDate(v).endOf('day').toDate(),
  },
  maxIdentities: {
    type: Number,
    default: 200,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  showAdvertiserCTOR: {
    type: Boolean,
    required: true,
    default: true,
  },
  showTotalAdClicksPerDay: {
    type: Boolean,
    required: true,
    default: true,
  },
  showTotalUniqueClicks: {
    type: Boolean,
    required: true,
    default: true,
  },
  email: {
    type: emailSchema,
    default: {},
  },
  // forms: {
  //   type: formsSchema,
  //   default: {},
  // },
  ads: {
    type: adsSchema,
    default: {},
  },
  adMetrics: {
    type: adMetricsSchema,
    default: {},
  },
  videoMetrics: {
    type: videoMetricsSchema,
    default: {},
  },
}, { timestamps: true });

schema.plugin(hashablePlugin);

schema.index({ deleted: 1 });
schema.index({ fullName: 'text' });
schema.index({ 'email._id': 1 });
schema.index({ fullName: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ startDate: 1, _id: 1 }, { unique: true });
schema.index({ endDate: 1, _id: 1 }, { unique: true });

schema.statics.findByHash = async function findByHash(hash, deleted = false) {
  const campaign = await this.findOne({ hash: hash || null, deleted });
  if (!campaign) throw new Error(`No campaign found for hash '${hash}'`);
  return campaign;
};

schema.methods.createFullName = async function createFullName() {
  const {
    name,
    customerId,
    startDate,
    endDate,
  } = this;

  const customer = await connection.model('customer').findById(customerId, { name: 1 });
  const campaignName = name ? `: ${name}` : '';
  const format = 'MMM Do, YYYY';
  const dateName = `${createDate(startDate).format(format)} to ${createDate(endDate).format(format)}`;
  return `${customer.name}${campaignName} (${dateName})`;
};

schema.pre('validate', async function setFullName() {
  this.fullName = await this.createFullName();
});

schema.post('save', async function clearReportCache() {
  // clear line item report cache.
  redis.del(`campaign:gam-line-item-report:${this.id}`).catch(newrelic.noticeError.bind(newrelic));
});

module.exports = schema;
