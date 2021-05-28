const { delegateToSchema } = require('@graphql-tools/delegate');

module.exports = ({
  type,
  id,
  strict,
  context,
  info,
} = {}) => {
  const input = { id, strict };
  return delegateToSchema({
    schema: info.schema,
    operation: 'query',
    fieldName: `gam_${type}`,
    args: { input },
    context,
    info,
  });
};
