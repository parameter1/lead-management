const { Schema } = require('mongoose');

const schema = new Schema({
  namespace: {
    type: String,
    required: true,
  },
  identifier: {
    type: String,
    required: true,
  },
  lastRetrievedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
}, {
  _id: false,
});

module.exports = schema;
