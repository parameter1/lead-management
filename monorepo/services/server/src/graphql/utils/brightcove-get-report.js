module.exports = async (input, { brightcove }) => {
  const { offset, limit } = input;
  const {
    item_count: totalCount,
    items,
    summary,
  } = await brightcove.analytics.getReport(input);

  const hasNextPage = totalCount > items.length + offset;
  const hasPreviousPage = Boolean(offset);
  const previousOffset = offset - limit;

  return {
    totalCount,
    nodes: items,
    summary,
    pageInfo: {
      hasNextPage,
      ...(hasNextPage && { nextOffset: offset + limit }),
      hasPreviousPage,
      ...(hasPreviousPage && { previousOffset: previousOffset > 0 ? previousOffset : 0 }),
    },
  };
};
