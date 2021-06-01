const { Schema } = require('mongoose');

// this model is for indexing only.
const schema = new Schema({});

schema.index({ entity: 1 }, { unique: true });
schema.index({ 'omeda.Status': 1 });
schema.index({ 'omeda.SentDate': 1 });

module.exports = schema;
