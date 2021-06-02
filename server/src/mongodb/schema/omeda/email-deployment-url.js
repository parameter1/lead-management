const { Schema } = require('mongoose');

const deploymentSchema = new Schema({
  entity: { type: String },
  name: { type: String },
  designation: { type: String },
  sentDate: { type: Date },
  typeId: { type: Number },
}, { _id: false });

const hostSchema = new Schema({
  value: { type: String },
});

const schema = new Schema({
  deployment: { type: deploymentSchema },
  urlId: { type: Schema.Types.ObjectId },
  host: { type: hostSchema },
  customerId: { type: Schema.Types.ObjectId },
  linkType: { type: String },
  omeda: { type: Schema.Types.Mixed },
  tagIds: { type: [Schema.Types.ObjectId] },
});

schema.index({ urlId: 1, 'deployment.entity': 1 }, { unique: true });
schema.index({ 'deployment.entity': 1 });

module.exports = schema;
