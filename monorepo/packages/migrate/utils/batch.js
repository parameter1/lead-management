const { log } = console;

const batch = async ({
  name,
  totalCount,
  limit,
  page = 1,
  handler = () => {},
  retriever = () => {},
  shouldLog = true,
} = {}) => {
  if (!totalCount) return;
  const pages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;
  if (shouldLog) log(`Handling batch ${page} of ${pages} (L/S ${limit}/${skip}) for '${name}'`);

  const results = await retriever({
    name,
    pages,
    page,
    limit,
    skip,
  });

  await handler({ results, name, page });
  if (page < pages) {
    await batch({
      name,
      totalCount,
      limit,
      page: page + 1,
      handler,
      retriever,
    });
  }
};

module.exports = batch;
