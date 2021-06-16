const { Schema } = require('mongoose');

const deploymentSchema = new Schema({
  entity: { type: String },
  trackId: { type: String },
  name: { type: String },
  designation: { type: String },
  sentDate: { type: Date },
  typeId: { type: Number },
  typeEntity: { type: String },
}, { _id: false });

const hostSchema = new Schema({
  value: { type: String },
  customerId: { type: Schema.Types.ObjectId },
  tagIds: [{ type: Schema.Types.ObjectId }],
});

const urlSchema = new Schema({
  original: { type: String },
});

const schema = new Schema({
  deployment: { type: deploymentSchema },
  url: { type: urlSchema },
  host: { type: hostSchema },
  customerId: { type: Schema.Types.ObjectId },
  linkType: { type: String },
  omeda: { type: Schema.Types.Mixed },
  tagIds: [{ type: Schema.Types.ObjectId }],
});

schema.index({ 'url._id': 1, 'deployment.entity': 1 }, { unique: true });
schema.index({ 'deployment.entity': 1 });
schema.index({ 'deployment.sentDate': 1 });
schema.index({ 'host._id': 1 });
schema.index({ customerId: 1, 'host.customerId': 1 });

module.exports = schema;
