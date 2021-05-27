const { Schema } = require('mongoose');
const moment = require('moment-timezone');

const schema = new Schema({
  day: {
    type: Date,
    required: true,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      return moment.tz(v, 'America/Chicago').startOf('day').toDate();
    },
  },
  last: {
    type: Date,
    required: true,
    set(v) {
      if (!(v instanceof Date)) return undefined;
      this.day = v;
      return v;
    },
  },
  action: {
    type: String,
    enum: ['click', 'impression'],
  },
  trackerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  usr: {
    type: Number,
    required: true,
  },
  lid: {
    type: String,
    trim: true,
    required: true,
  },
  cid: {
    type: String,
    trim: true,
    required: true,
  },
  n: {
    type: Number,
    default: 0,
  },
});

schema.index({ trackerId: 1 });
schema.index({ action: 1, trackerId: 1 });
schema.index({
  action: 1,
  day: 1,
  trackerId: 1,
  usr: 1,
  lid: 1,
  cid: 1,
}, { unique: true });

schema.methods.aggregateSave = async function aggregateSave() {
  await this.validate();
  const $setOnInsert = {
    action: this.action,
    day: this.day,
    trackerId: this.trackerId,
    usr: this.usr,
    lid: this.lid,
    cid: this.cid,
  };
  const $set = { last: this.last };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };

  const criteria = $setOnInsert;
  await this.model('event-ad-creative').updateOne(criteria, update, { upsert: true });
};

module.exports = schema;
