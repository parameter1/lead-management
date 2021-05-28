const externalSourceSchema = require('../schema/external-source');

module.exports = function externalSourcePlugin(schema, options) {
  schema.add({
    externalSource: {
      type: externalSourceSchema,
      required: options && options.required ? options.required : false,
    },
  });

  schema.index({
    'externalSource.namespace': 1,
    'externalSource.identifier': 1,
  }, {
    unique: true,
    partialFilterExpression: { externalSource: { $exists: true } },
  });
};
