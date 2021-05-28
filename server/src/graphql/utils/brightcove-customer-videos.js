const loadVideos = require('./brightcove-load-videos');

module.exports = async (customerId, input, { brightcove, loaders }) => {
  const customer = await loaders.customer.load(customerId);
  if (!customer || customer.deleted) throw new Error(`No customer record found for ID ${customerId}.`);
  const { brightcoveVideoIds } = customer;
  if (!brightcoveVideoIds || !brightcoveVideoIds.length) {
    return {
      totalCount: 0,
      nodes: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    };
  }

  return loadVideos({
    ...input,
    query: brightcoveVideoIds.map((id) => `(+id:${id})`).join(' OR '),
  }, { brightcove });
};
