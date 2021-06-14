const { Schema } = require('mongoose');

const schema = new Schema({
  entity: { type: String },
  urlIds: [{ type: Schema.Types.ObjectId }],
  omeda: { type: Schema.Types.Mixed },
  lastRetrievedAt: { type: Date },
}, { timestamps: true });

schema.index({ entity: 1 }, { unique: true });
schema.index({ 'omeda.CreatedDate': 1, _id: 1 });
schema.index({ 'omeda.Name': 1, _id: 1 });
schema.index({ 'omeda.Status': 1 });
schema.index({ 'omeda.SentDate': 1, _id: 1 });

schema.statics.metricMap = () => new Map([
  ['sent', 'RecipientCount'],
  ['delivered', 'SentCount'],
  ['opens', 'TotalOpens'],
  ['clicks', 'TotalClicks'],
  ['uniqueOpens', 'UniqueOpens'],
  ['uniqueClicks', 'UniqueClicks'],
  ['unsubscribes', 'TotalUnsubscribe'],
  ['bounces', 'BounceCount'],
]);

module.exports = schema;
