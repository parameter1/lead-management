const { getAsArray } = require('@parameter1/utils');
const MongoDBClient = require('@parameter1/mongodb/client');
const { ObjectId } = require('@parameter1/mongodb');
const { MONGO_DSN } = require('../env');
const omeda = require('./client');

const mongodb = new MongoDBClient({ url: MONGO_DSN });
const pattern = /lt\.lid=([a-f0-9]{24})/;
const { log } = console;

module.exports = async ({ trackId } = {}) => {
  const now = new Date();
  const db = await mongodb.db({ name: 'lead-management' });
  log(`Loading email deployment ${trackId} from Omeda...`);
  const { data } = await omeda.resource('email').lookupDeploymentById({ trackId });

  // create a distinct map of all tracked URLs found in the deployment
  const urlMap = getAsArray(data, 'LinkTracking').reduce((map, { LinkUrl }) => {
    const matches = pattern.exec(LinkUrl);
    if (!matches) return map;
    map.set(matches[1], new ObjectId(matches[1]));
    return map;
  }, new Map());

  log('Loading deployment URLs...');
  // load all URLs for the deployment
  const urls = await (async () => {
    const collection = db.collection('extracted-urls');
    const cursor = await collection.find({
      _id: { $in: [...urlMap.values()] },
    }, {
      projection: {
        resolvedHostId: 1,
        customerId: 1,
        tagIds: 1,
        linkType: 1,
      },
    });
    return cursor.toArray();
  })();

  // upsert deployment.
  log(`Upserting email deployment ${trackId}...`);
  await db.collection('omeda-email-deployments').updateOne({ _id: data.TrackId }, {
    $setOnInsert: { _id: data.TrackId, createdAt: now },
    $set: {
      data,
      updatedAt: now,
      urlIds: [...urls.map((url) => url._id)],
    },
  }, { upsert: true });

  // load a the distinct host map for the found urls
  // @todo use dataloaders?
  const hostMap = await (async () => {
    const distinctHosts = urls.reduce((map, { resolvedHostId }) => {
      map.set(`${resolvedHostId}`, resolvedHostId);
      return map;
    }, new Map());
    const collection = db.collection('extracted-hosts');

    const cursor = await collection.find({
      _id: { $in: [...distinctHosts.values()] },
    }, {
      projection: {
        value: 1,
        customerId: 1,
        tagIds: 1,
      },
    });
    const hosts = await cursor.toArray();
    return hosts.reduce((map, host) => {
      map.set(`${host._id}`, host);
      return map;
    }, new Map());
  })();

  // upsert deployment URLs
  const urlOps = urls.map((url) => {
    const host = hostMap.get(`${url.resolvedHostId}`);

    const tagSet = new Set([
      ...getAsArray(url, 'tagIds'),
      ...getAsArray(host, 'tagIds'),
    ].map((id) => `${id}`));

    const filter = { urlId: url._id, 'deployment._id': data.TrackId };
    return {
      updateOne: {
        filter,
        update: {
          $setOnInsert: filter,
          $set: {
            host: { _id: host._id, value: host.value },
            customerId: url.customerId || host.customerId,
            linkType: url.linkType,
            tagIds: [...tagSet].map((id) => new ObjectId(id)),
            'deployment.name': data.DeploymentName,
            'deployment.designation': data.DeploymentDesignation,
            'deployment.sentDate': data.SentDate,
            'deployment.typeId': data.DeploymentTypeId,
          },
        },
        upsert: true,
      },
    };
  });
  log(`Upserting ${urlOps.length} URLs for ${trackId}...`);
  if (urlOps.length) await db.collection('omeda-email-deployment-urls').bulkWrite(urlOps);
  log(`URL upsert complete for ${trackId}`);
};
