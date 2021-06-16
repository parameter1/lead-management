const omeda = require('@lead-management/omeda');
const loadDB = require('@lead-management/mongodb/load-db');

const deploymentTypeEntity = require('@lead-management/omeda/entity-id/deployment-type');
const demographicEntity = require('@lead-management/omeda/entity-id/demographic');
const productEntity = require('@lead-management/omeda/entity-id/product');

const createOpFor = ({
  brand,
  entity,
  data,
  now,
}) => {
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
        entity: demographicEntity({ id: demographic.Id }),
        data: demographic,
        now,
      }));
      if (ops.length) await db.collection('omeda-demographics').bulkWrite(ops);
      return ops;
    })(),
    (async () => {
      const ops = DeploymentTypes.map((type) => createOpFor({
        brand,
        entity: deploymentTypeEntity({ id: type.Id }),
        data: type,
        now,
      }));
      if (ops.length) await db.collection('omeda-deployment-types').bulkWrite(ops);
      return ops;
    })(),
    (async () => {
      const ops = Products.map((product) => createOpFor({
        brand,
        entity: productEntity({ id: product.Id }),
        data: product,
        now,
      }));
      if (ops.length) await db.collection('omeda-products').bulkWrite(ops);
      return ops;
    })(),
  ]);
  return { demographics, deploymentTypes, products };
};
