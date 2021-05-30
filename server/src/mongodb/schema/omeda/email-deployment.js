const { Schema } = require('mongoose');

// this model is for indexing only.
const schema = new Schema({});

schema.index({ 'data.Status': 1 });
schema.index({ 'data.SentDate': 1 });

module.exports = schema;
