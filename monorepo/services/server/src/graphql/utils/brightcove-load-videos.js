module.exports = async (input, { brightcove }) => {
  const {
    limit,
    offset,
    sort,
    search,
  } = input;

  let s;
  if (sort && sort.field) {
    s = `${sort.field}`;
    if (sort.order === 'DESC') s = `-${s}`;
  }

  let { query } = input;
  if (search && search.field && search.phrase) {
    const phrase = `${search.field}:"${search.phrase}"`;
    query = query ? `(${query}) AND (${phrase})` : phrase;
  }

  const [{ count: totalCount }, videos] = await Promise.all([
    brightcove.cms.getVideoCount({ query }),
    brightcove.cms.getVideos({
      limit,
      offset,
      sort: s,
      query,
    }),
  ]);

  const hasNextPage = totalCount > videos.length + offset;
  const hasPreviousPage = Boolean(offset);
  const previousOffset = offset - limit;

  return {
    totalCount,
    nodes: videos,
    pageInfo: {
      hasNextPage,
      ...(hasNextPage && { nextOffset: offset + limit }),
      hasPreviousPage,
      ...(hasPreviousPage && { previousOffset: previousOffset > 0 ? previousOffset : 0 }),
    },
  };
};
