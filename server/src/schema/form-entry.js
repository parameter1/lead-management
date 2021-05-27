const { Schema } = require('mongoose');
const moment = require('moment-timezone');
const importPlugin = require('../plugins/import');

const schema = new Schema({
  formId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'form',
  },
  identifier: {
    type: Number,
    required: true,
  },
  inactive: {
    type: Boolean,
    required: true,
    default: false,
  },
  values: {
    type: Schema.Types.Mixed,
    default: {},
  },
  submittedAt: {
    type: Date,
    requird: true,
    set(v) {
      return moment.tz(v, 'America/Chicago').toDate();
    },
  },
}, { timestamps: true });

schema.plugin(importPlugin);

schema.index({ formId: 1, identifier: 1 }, { unique: true });
schema.index({ submittedAt: 1 });
schema.index({ identifier: 1, _id: 1 }, { unique: true });
schema.index({ identifier: -1, _id: -1 }, { unique: true });

module.exports = schema;
