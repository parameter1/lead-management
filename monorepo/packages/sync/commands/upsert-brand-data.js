const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');

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

module.exports = async (params = {}) => {
  const { tenantKey } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
  }).required(), params);

  const { db, omeda } = await loadTenant({ key: tenantKey });
  const { data } = await omeda.resource('brand').comprehensiveLookup();

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
        entity: omeda.entity.demographic({ id: demographic.Id }),
        data: demographic,
        now,
      }));
      if (ops.length) await db.collection('omeda-demographics').bulkWrite(ops);
      return ops;
    })(),
    (async () => {
      const ops = DeploymentTypes.map((type) => createOpFor({
        brand,
        entity: omeda.entity.deploymentType({ id: type.Id }),
        data: type,
        now,
      }));
      if (ops.length) await db.collection('omeda-deployment-types').bulkWrite(ops);
      return ops;
    })(),
    (async () => {
      const ops = Products.map((product) => createOpFor({
        brand,
        entity: omeda.entity.product({ id: product.Id }),
        data: product,
        now,
      }));
      if (ops.length) await db.collection('omeda-products').bulkWrite(ops);
      return ops;
    })(),
  ]);
  return { demographics, deploymentTypes, products };
};
