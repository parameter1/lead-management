const { Schema } = require('mongoose');
const connection = require('../../mongoose');

const choiceFilterSchema = new Schema({
  fieldId: {
    type: String,
  },
  title: {
    type: String,
  },
  choices: {
    type: [String],
  },
});

const schema = new Schema({
  /**
   *
   */
  formId: {
    type: Schema.Types.ObjectId,
    ref: 'form',
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('form').findById(v, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No form found for ID {VALUE}',
    },
  },

  /**
   *
   */
  choiceFilters: {
    type: [choiceFilterSchema],
    default: () => [],
  },
});

module.exports = schema;
