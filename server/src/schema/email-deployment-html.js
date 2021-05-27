const { Schema } = require('mongoose');
const externalSourcePlugin = require('../plugins/external-source');

const schema = new Schema({
  body: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

schema.plugin(externalSourcePlugin, { required: true });

module.exports = schema;
