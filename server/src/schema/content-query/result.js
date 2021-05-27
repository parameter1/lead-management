const { Schema } = require('mongoose');
const moment = require('moment-timezone');

const schema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  queryId: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  contentCount: {
    type: Number,
    required: true,
    default: 0,
  },
  ranAt: {
    type: Date,
    required: true,
  },
  ranById: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'user',
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  identityIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'identity',
    },
  ],
});

schema.virtual('shortName').get(function getShortName() {
  const start = moment(this.startDate).tz('America/Chicago');
  const end = moment(this.endDate).tz('America/Chicago');
  return `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`;
});

schema.pre('save', function setName(done) {
  const start = moment(this.startDate).tz('America/Chicago');
  const end = moment(this.endDate).tz('America/Chicago');
  this.name = `${start.format('MMM Do, YYYY')} - ${end.format('MMM Do, YYYY')}`;
  done();
});

schema.index({ deleted: 1 });
schema.index({ queryId: 1 });
schema.index({ ranAt: 1, _id: 1 }, { unique: true });
schema.index({ ranAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
