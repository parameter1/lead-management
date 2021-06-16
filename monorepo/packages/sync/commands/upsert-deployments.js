const Joi = require('@parameter1/joi');
const { ObjectId } = require('@lead-management/mongodb');
const { validateAsync } = require('@parameter1/joi/utils');
const { get, getAsArray } = require('@parameter1/utils');
const loadDB = require('@lead-management/mongodb/load-db');
const deploymentTypeEntity = require('@lead-management/omeda/entity-id/deployment-type');

const extractUrlId = require('../utils/extract-url-id');
const loadDeployments = require('../ops/load-deployments');

module.exports = async (params = {}) => {
  const { trackIds } = await validateAsync(Joi.object({
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
  }), params);

  const now = new Date();
  const deployments = await loadDeployments({ trackIds });

  const allUrlIds = new Set();
  const deploymentUrlIds = new Map();
  deployments.forEach(({ data }) => {
    const { TrackId } = data;
    getAsArray(data, 'LinkTracking').forEach(({ LinkUrl }) => {
      const urlId = extractUrlId(LinkUrl);
      if (!urlId) return;
      allUrlIds.add(urlId);
      if (!deploymentUrlIds.has(TrackId)) deploymentUrlIds.set(TrackId, new Set());
      deploymentUrlIds.get(TrackId).add(urlId);
    });
  });

  const db = await loadDB();
  const urls = await db.collection('extracted-urls').find({
    _id: { $in: [...allUrlIds].map((id) => new ObjectId(id)) },
  }, {
    projection: {
      resolvedHostId: 1,
      customerId: 1,
      tagIds: 1,
      linkType: 1,
      'values.original': 1,
    },
  }).toArray();
  const urlMap = urls.reduce((map, url) => {
    map.set(`${url._id}`, url);
    return map;
  }, new Map());

  const hostMap = await (async () => {
    const distinctHosts = urls.reduce((map, { resolvedHostId }) => {
      map.set(`${resolvedHostId}`, resolvedHostId);
      return map;
    }, new Map());
    const hosts = await db.collection('extracted-hosts').find({
      _id: { $in: [...distinctHosts.values()] },
    }, {
      projection: {
        value: 1,
        customerId: 1,
        tagIds: 1,
      },
    }).toArray();
    return hosts.reduce((map, host) => {
      map.set(`${host._id}`, host);
      return map;
    }, new Map());
  })();

  const urlOps = [];
  const verifedDeploymentUrlIds = new Map();
  deploymentUrlIds.forEach((urlIds, trackId) => {
    const { data, entity } = deployments.get(trackId);
    if (!verifedDeploymentUrlIds.has(trackId)) verifedDeploymentUrlIds.set(trackId, []);
    urlIds.forEach((urlId) => {
      const url = urlMap.get(urlId);
      if (!url) return;
      verifedDeploymentUrlIds.get(trackId).push(url._id);

      const host = hostMap.get(`${url.resolvedHostId}`);

      const filter = { 'url._id': url._id, 'deployment.entity': entity };
      const update = {
        $setOnInsert: filter,
        $set: {
          'url.original': get(url, 'values.original', null),
          host: {
            _id: host._id,
            value: host.value,
            customerId: host.customerId || null,
            tagIds: getAsArray(host, 'tagIds'),
          },
          customerId: url.customerId || null,
          linkType: url.linkType,
          tagIds: getAsArray(url, 'tagIds'),
          'deployment.name': data.DeploymentName,
          'deployment.designation': data.DeploymentDesignation,
          'deployment.sentDate': data.SentDate,
          'deployment.typeId': data.DeploymentTypeId,
          'deployment.typeEntity': deploymentTypeEntity({ id: data.DeploymentTypeId }),
        },
      };
      urlOps.push({ updateOne: { filter, update, upsert: true } });
    });
  });

  const deploymentOps = [];
  deployments.forEach((deployment) => {
    const { entity, data } = deployment;
    const { TrackId } = data;
    const filter = { entity };
    const update = {
      $setOnInsert: { ...filter, createdAt: now },
      $set: {
        typeEntity: deploymentTypeEntity({ id: data.DeploymentTypeId }),
        lastRetrievedAt: now,
        updatedAt: now,
        urlIds: verifedDeploymentUrlIds.get(TrackId) || [],
        omeda: data,
      },
    };
    deploymentOps.push({ updateOne: { filter, update, upsert: true } });
  });

  const promises = [];
  if (deploymentOps.length) promises.push(db.collection('omeda-email-deployments').bulkWrite(deploymentOps));
  if (urlOps.length) promises.push(db.collection('omeda-email-deployment-urls').bulkWrite(urlOps));
  await Promise.all(promises);
  return { deploymentOps, urlOps };
};
