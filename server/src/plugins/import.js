module.exports = function importPlugin(schema) {
  schema.add({
    wasImported: {
      type: Boolean,
    },
  });

  schema.index({ wasImported: 1 });
};
