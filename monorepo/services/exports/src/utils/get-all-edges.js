const {
  get,
  set,
  getAsArray,
  getAsObject,
} = require('@parameter1/utils');

const exhaust = async (apollo, {
  opName,
  query,
  variables,
  nextCursor,
}, edges = []) => {
  if (nextCursor) set(variables, 'pagination.after', nextCursor);

  const { data } = await apollo.query({ query, variables });
  const response = getAsObject(data, opName);
  const endCursor = get(response, 'pageInfo.endCursor');
  const theseEdges = getAsArray(response, 'edges');
  edges.push(...theseEdges);
  if (endCursor) {
    await exhaust(apollo, {
      opName,
      query,
      variables,
      nextCursor: endCursor,
    }, edges);
  }
  return edges;
};

module.exports = exhaust;
