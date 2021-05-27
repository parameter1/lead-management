const createHash = require('../utils/create-hash');

module.exports = function hashPlugin(schema) {
  schema.add({
    hash: {
      type: String,
      unique: true,
      required: true,
    },
  });

  schema.pre('validate', function setHash(done) {
    if (!this.hash) {
      this.hash = createHash(this.id);
    }
    done();
  });
};
