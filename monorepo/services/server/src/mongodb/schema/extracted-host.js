const { Schema } = require('mongoose');
const { isFQDN } = require('validator');
const newrelic = require('../../newrelic');
const connection = require('../connection');
const urlParamsPlugin = require('../plugins/url-params');

const schema = new Schema({
  value: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate: {
      validator: isFQDN,
      message: '{VALUE} is an invalid host name.',
    },
  },
  customerId: {
    type: Schema.Types.ObjectId,
    validate: {
      async validator(v) {
        if (!v) return true;
        const doc = await connection.model('customer').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No customer was found for {VALUE}',
    },
  },
  tagIds: [
    {
      type: Schema.Types.ObjectId,
      validate: {
        async validator(v) {
          const doc = await connection.model('tag').findOne({ _id: v }, { _id: 1 });
          if (doc) return true;
          return false;
        },
        message: 'No tag was found for {VALUE}',
      },
    },
  ],
});

schema.plugin(urlParamsPlugin);

schema.index({ customerId: 1 });

schema.pre('save', async function updateDeploymentUrls() {
  const fields = ['customerId', 'tagIds'];
  const shouldUpdate = fields.some((field) => this.isModified(field));
  if (!shouldUpdate) return;

  const run = async () => {
    const $set = {
      'host.customerId': this.customerId || null,
      'host.tagIds': this.tagIds,
    };
    await connection.model('omeda-email-deployment-url').updateMany({
      'host._id': this.id,
    }, { $set });
  };

  // run update but do not await
  run().catch(newrelic.noticeError.bind(newrelic));
});

module.exports = schema;
