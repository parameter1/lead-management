const { Schema } = require('mongoose');

// this model is for indexing only.
const schema = new Schema({});

schema.index({ urlId: 1, 'deployment._id': 1 }, { unique: true });
schema.index({ 'deployment._id': 1 });

module.exports = schema;
