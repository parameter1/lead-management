const { delegateToSchema } = require('@graphql-tools/delegate');
const { WrapQuery } = require('@graphql-tools/wrap');
const { camelize, pluralize } = require('inflected');
const { gql } = require('apollo-server-express');
const ucfirst = require('../../utils/ucfirst');

module.exports = ({
  type,
  criteria,
  search,
  sort,
  limit,
  offset,
  context,
  info,
  fields,
} = {}) => {
  let where = criteria;
  if (search) where = `${where} AND ${search.field} LIKE '%${search.phrase}%'`;

  let orderBy;
  if (sort && sort.field) orderBy = `${camelize(sort.field.toLowerCase(), false)} ${sort.order || 'ASC'}`;

  const input = {
    where,
    limit,
    offset,
    orderBy,
  };

  const transforms = [];
  const fieldName = `gam_${pluralize(type)}`;
  if (fields) {
    const fragmentName = `GAM_${ucfirst(type)}Connection`;
    const fragment = gql`
      fragment GAMLoadManySelectionsFragment on ${fragmentName} {
        ${fields}
      }
    `;
    const { selectionSet } = fragment.definitions[0];
    transforms.push(new WrapQuery([fieldName], () => selectionSet, (r) => r));
  }

  return delegateToSchema({
    schema: info.schema,
    operation: 'query',
    fieldName,
    args: { input },
    context,
    info,
    transforms,
  });
};
