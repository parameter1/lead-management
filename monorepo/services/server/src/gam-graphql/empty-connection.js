module.exports = ({ statement = {} } = {}) => ({
  totalCount: 0,
  nodes: [],
  statement,
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    nextOffset: null,
    previousOffset: null,
  },
});
