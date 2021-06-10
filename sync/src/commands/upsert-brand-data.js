const omeda = require('../omeda');
const loadDB = require('../mongodb/load-db');
const entityId = require('../utils/entity-id');

const createOpFor = ({
  brand,
  type,
  data,
  now,
}) => {
  const entity = entityId({ brand, type, id: `${data.Id}` });
  const filter = { entity };
  const update = {
    $setOnInsert: {
      brand: brand.toLowerCase(),
      ...filter,
    },
    $set: {
      lastRetrievedAt: now,
      data,
    },
  };
  return { updateOne: { filter, update, upsert: true } };
};

module.exports = async () => {
  const [db, { data }] = await Promise.all([
    loadDB(),
    omeda.resource('brand').comprehensiveLookup(),
  ]);

  const {
    BrandAbbrev: brand,
    Demographics,
    DeploymentTypes,
    Products,
  } = data;

  const now = new Date();

  const [demographics, deploymentTypes, products] = await Promise.all([
    (async () => {
      const ops = Demographics.map((demographic) => createOpFor({
        brand,
        type: 'demographic',
        data: demographic,
        now,
      }));
      if (ops.length) await db.collection('omeda-demographics').bulkWrite(ops);
      return ops;
    })(),
    (async () => {
      const ops = DeploymentTypes.map((type) => createOpFor({
        brand,
        type: 'deployment-type',
        data: type,
        now,
      }));
      if (ops.length) await db.collection('omeda-deployment-types').bulkWrite(ops);
      return ops;
    })(),
    (async () => {
      const ops = Products.map((product) => createOpFor({
        brand,
        type: 'product',
        data: product,
        now,
      }));
      if (ops.length) await db.collection('omeda-products').bulkWrite(ops);
      return ops;
    })(),
  ]);
  return { demographics, deploymentTypes, products };
};
