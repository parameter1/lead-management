const { Schema } = require('mongoose');

const schema = new Schema({
  sent: {
    type: Number,
    default: 0,
  },
  delivered: {
    type: Number,
    default: 0,
  },
  uniqueOpens: {
    type: Number,
    default: 0,
  },
  uniqueClicks: {
    type: Number,
    default: 0,
  },
  unsubscribes: {
    type: Number,
    default: 0,
  },
  forwards: {
    type: Number,
    default: 0,
  },
  bounces: {
    type: Number,
    default: 0,
  },
}, {
  _id: false,
});

module.exports = schema;
