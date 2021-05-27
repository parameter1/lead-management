const { Schema } = require('mongoose');
const shortid = require('shortid');
const connection = require('../mongoose');

const schema = new Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    default() {
      return shortid.generate();
    },
  },
  urlIds: [
    {
      type: Schema.Types.ObjectId,
      validate: {
        async validator(id) {
          const doc = await connection.model('extracted-url').findById(id, { _id: 1 });
          if (doc) return true;
          return false;
        },
        message: 'No URL was found for {VALUE}',
      },
    },
  ],
  processed: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = schema;
