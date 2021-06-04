const { Schema } = require('mongoose');
const hashablePlugin = require('../plugins/hashable');
const connection = require('../connection');

const schema = new Schema({
  name: {
    type: String,
    required: true,
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
    required: true,
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
  notes: {
    type: String,
    trim: true,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { timestamps: true });

schema.plugin(hashablePlugin);

schema.index({ deleted: 1 });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ fullName: 'text' });
schema.index({ fullName: 1, _id: 1 }, { unique: true });

schema.statics.findByHash = async function findByHash(hash, deleted = false) {
  const campaign = await this.findOne({ hash: hash || null, deleted });
  if (!campaign) throw new Error(`No campaign found for hash '${hash}'`);
  return campaign;
};

schema.methods.createFullName = async function createFullName() {
  const {
    name,
    customerId,
  } = this;

  const customer = await connection.model('customer').findById(customerId, { name: 1 });
  return `${name} (${customer.name})`;
};

schema.pre('validate', async function setFullName() {
  this.fullName = await this.createFullName();
});

module.exports = schema;
