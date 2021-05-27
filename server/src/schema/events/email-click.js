const { Schema } = require('mongoose');
const moment = require('moment-timezone');
// const EmailSend = require('../../models/email-send');
// const Identity = require('../../models/identity');
// const ExtractedUrl = require('../../models/extracted-url');
const importPlugin = require('../../plugins/import');

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
  url: {
    type: Schema.Types.ObjectId,
    required: true,
    // validate: {
    //   async validator(v) {
    //     const doc = await ExtractedUrl.findOne({ _id: v }, { _id: 1 });
    //     if (doc) return true;
    //     return false;
    //   },
    //   message: 'No url found for ID {VALUE}',
    // },
  },
  usr: {
    type: Schema.Types.ObjectId,
    required: true,
    // validate: {
    //   async validator(v) {
    //     const doc = await Identity.findOne({ _id: v }, { _id: 1 });
    //     if (doc) return true;
    //     return false;
    //   },
    //   message: 'No identity found for ID {VALUE}',
    // },
  },
  job: {
    type: Schema.Types.ObjectId,
    required: true,
    // validate: {
    //   async validator(v) {
    //     const doc = await EmailSend.findOne({ _id: v }, { _id: 1 });
    //     if (doc) return true;
    //     return false;
    //   },
    //   message: 'No email send found for ID {VALUE}',
    // },
  },
  n: {
    type: Number,
    default: 0,
  },
});

schema.plugin(importPlugin);
schema.index({ wasImported: 1 });

schema.index({
  day: 1,
  job: 1,
  url: 1,
  usr: 1,
}, { unique: true });

schema.methods.aggregateSave = async function aggregateSave() {
  await this.validate();
  const $setOnInsert = {
    day: this.day,
    url: this.url,
    usr: this.usr,
    job: this.job,
  };
  const $set = { last: this.last };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };

  const criteria = $setOnInsert;
  await this.model('event-email-click').updateOne(criteria, update, { upsert: true });
};

module.exports = schema;
