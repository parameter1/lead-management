const { Schema } = require('mongoose');
const { stringify, dasherize } = require('../../utils/inflector');

const namespaceSchema = new Schema({
  z: {
    type: String,
    set(v) {
      return dasherize(v);
    },
  },
  b: {
    type: String,
    set(v) {
      return dasherize(v);
    },
  },
  n: {
    type: String,
    required: true,
    set(v) {
      return dasherize(v);
    },
  },
}, { _id: false });

const schema = new Schema({
  /**
   * The entity key, in `id*zbn`.
   */
  key: {
    type: String,
    unique: true,
    required: true,
  },
  /**
   * The client/external identifier.
   */
  cid: {
    type: String,
    required: true,
    trim: true,
    set(v) {
      return stringify(v);
    },
  },
  /**
   * The client/external namespace object.
   */
  ns: {
    type: namespaceSchema,
    required: true,
    default() {
      return {};
    },
  },
});

module.exports = schema;
