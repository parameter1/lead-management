const DataLoader = require('dataloader');
const fragments = require('./fragments');

const fragmentMap = {
  company: fragments.COMPANY_FRAGMENT,
};

const createBatchFn = ({ gam, type }) => async (ids) => {
  const fragment = fragmentMap[type];
  const { nodes } = await gam.findManyByIDs({ ids, type, fragment });
  const map = nodes.reduce((m, node) => {
    m.set(`${node.id}`, node);
    return m;
  }, new Map());
  return ids.map((id) => map.get(`${id}`));
};

module.exports = ({ gam }) => ({
  company: new DataLoader(createBatchFn({ gam, type: 'company' })),
});
