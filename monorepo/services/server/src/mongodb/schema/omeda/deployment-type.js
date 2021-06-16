const { Schema } = require('mongoose');

const schema = new Schema({
  entity: { type: String },
  omeda: { type: Schema.Types.Mixed },
});

module.exports = schema;
