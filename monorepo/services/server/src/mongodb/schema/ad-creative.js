const { Schema } = require('mongoose');

const advertiserSchema = new Schema({
  identifier: {
    type: String,
    trim: true,
  },
});

const orderSchema = new Schema({
  identifier: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
});

const lineItemMetricsSchema = new Schema({
  impressionsDelivered: Number,
  clicksDelivered: Number,
  videoCompletionsDelivered: Number,
  videoStartsDelivered: Number,
  viewableImpressionsDelivered: Number,
});

const lineitemSchema = new Schema({
  identifier: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  metrics: {
    type: lineItemMetricsSchema,
  },
});

const schema = new Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    trim: true,
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  advertiser: {
    type: advertiserSchema,
  },
  order: {
    type: orderSchema,
  },
  lineitem: {
    type: lineitemSchema,
  },
  trackerIds: {
    type: [Schema.Types.ObjectId],
  },
  lastRetrievedAt: {
    type: Date,
    required: true,
  },
});

schema.methods.aggregateSave = async function aggregateSave() {
  await this.validate();
  const $setOnInsert = {
    identifier: this.identifier,
    'lineitem.identifier': this.get('lineitem.identifier'),
  };
  const $addToSet = { trackerIds: this.trackerIds };
  const $set = [
    'name',
    'type',
    'width',
    'height',
    'lastRetrievedAt',
    'advertiser.identifier',
    'order.identifier',
    'order.name',
    'lineitem.name',
    'lineitem.metrics',
  ].reduce((o, path) => ({ ...o, [path]: this.get(path) }), {});

  const update = { $setOnInsert, $set, $addToSet };
  const criteria = $setOnInsert;
  await this.model('ad-creative').updateOne(criteria, update, { upsert: true });
};

schema.index({ identifier: 1, 'lineitem.identifier': 1 }, { unique: true });

module.exports = schema;
