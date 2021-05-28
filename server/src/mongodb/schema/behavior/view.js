const { Schema } = require('mongoose');
const dayjs = require('../../../dayjs');

const schema = new Schema({
  /**
   * The entity identifier, in `zbn` format.
   * Exmaple: 1234*zone.base.name
   */
  ent: {
    type: String,
    required: true,
  },
  /**
   * The user identifier, in `zbn` format.
   * Exmaple: 1234*zone.base.name
   */
  usr: {
    type: String,
    required: true,
  },
  n: {
    type: Number,
    default: 0,
    required: true,
  },
  day: {
    type: Date,
    required: true,
    set: (v) => {
      if (!(v instanceof Date)) return undefined;
      return dayjs.tz(v, 'America/Chicago').startOf('day').toDate();
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
});

schema.index({ day: 1, ent: 1 });
schema.index({ day: 1, usr: 1, ent: 1 }, { unique: true });
schema.index({ day: 1 }, { expireAfterSeconds: 7776000 });

schema.methods.aggregateSave = async function aggregateSave() {
  await this.validate();
  const $setOnInsert = {
    day: this.day,
    usr: this.usr,
    ent: this.ent,
  };
  const $set = { last: this.last };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };

  const criteria = $setOnInsert;

  await this.model('behavior-view').updateOne(criteria, update, { upsert: true });
};

module.exports = schema;
