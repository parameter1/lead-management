const { Schema } = require('mongoose');
const moment = require('moment-timezone');
const connection = require('../../mongoose');
const hashablePlugin = require('../../plugins/hashable');

const dateRangeSchema = new Schema({
  start: {
    type: Date,
    required: true,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      return moment.tz(v, 'America/Chicago').startOf('day').toDate();
    },
  },
  end: {
    type: Date,
    required: true,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      return moment.tz(v, 'America/Chicago').endOf('day').toDate();
    },
  },
});

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'order',
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('order').findById(v, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No order found for ID {VALUE}',
    },
  },
  range: {
    type: dateRangeSchema,
    required: true,
    default: {},
  },
  notes: {
    type: String,
    trim: true,
  },
  totalValue: {
    type: Number,
    required: true,
  },
  requiredLeads: {
    type: Number,
    required: true,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  discriminatorKey: 'type',
  timestamps: true,
});

schema.plugin(hashablePlugin);

schema.statics.findByHash = async function findByHash(hash, deleted = false) {
  const lineitem = await this.findOne({ hash: hash || null, deleted });
  if (!lineitem) throw new Error(`No line item found for hash '${hash}'`);
  return lineitem;
};

schema.index({ deleted: 1 });
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
