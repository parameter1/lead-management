const MongoDBClient = require('@parameter1/mongodb/client');
const { iterateCursor } = require('@parameter1/mongodb/utils');
const eachSeries = require('async/eachSeries');
const {
  DESTINATION_DB_NAME,
  DESTINATION_MONGO_URI,
  SOURCE_DB_NAME,
  SOURCE_MONGO_URI,
} = require('./env');
const batch = require('./utils/batch');
const transformers = require('./transformers');

process.on('unhandledRejection', (e) => { throw e; });

const { log } = console;

const limit = 1000;
const collections = [
  'ad-creative-trackers',
  'ad-creatives',
  'customers',
  'excluded-email-domains',
  'extracted-hosts',
  'extracted-urls',
  'tags',
  'users',
];

const source = new MongoDBClient({ url: SOURCE_MONGO_URI });
const destination = new MongoDBClient({ url: DESTINATION_MONGO_URI });

const run = async () => {
  log('Connecting to MongoDB...');
  await Promise.all([
    source.connect().then(() => log(`SOURCE: ${SOURCE_MONGO_URI}`)),
    destination.connect().then(() => log(`DESTINATION: ${DESTINATION_MONGO_URI}`)),
  ]);

  log('');
  log(`SOURCE DB: ${SOURCE_DB_NAME}`);
  log(`DESTINATION DB: ${DESTINATION_DB_NAME}`);
  log('');

  await eachSeries(collections, async (collName) => {
    log(`Processing the '${collName}' collection...`);
    const [fromColl, toColl] = await Promise.all([
      source.collection({ dbName: SOURCE_DB_NAME, name: collName }),
      destination.collection({ dbName: DESTINATION_DB_NAME, name: collName }),
    ]);
    const transformer = transformers.get(collName);
    const totalCount = await fromColl.countDocuments();

    const retriever = async ({ skip }) => fromColl.find({}, {
      sort: { _id: 1 },
      limit,
      skip,
    });

    const handler = async ({ results: cursor }) => {
      const bulkOps = [];
      await iterateCursor(cursor, async (doc) => {
        const transformed = transformer ? transformer(doc) : doc;
        const { _id, ...rest } = transformed;

        // remove all `wasImported` flags from the old migration
        delete rest.wasImported;

        bulkOps.push({
          updateOne: {
            filter: { _id },
            update: {
              $setOnInsert: { _id },
              $set: rest,
            },
            upsert: true,
          },
        });
      });
      if (bulkOps.length) await toColl.bulkWrite(bulkOps);
    };

    await batch({
      name: collName,
      totalCount,
      limit,
      handler,
      retriever,
    });

    log(`Processing for '${collName}' complete.`);
    log('');
  });

  log('Migrating inactive identities....');
  await (async () => {
    const [fromColl, toColl] = await Promise.all([
      source.collection({ dbName: SOURCE_DB_NAME, name: 'identities' }),
      destination.collection({ dbName: DESTINATION_DB_NAME, name: 'legacy-inactive-identities' }),
    ]);
    const identities = await fromColl.find({
      emailAddress: { $exists: true },
      deleted: { $ne: true },
      $or: [
        { inactive: true },
        { 'inactiveCustomerIds.0': { $exists: true } },
      ],
    }, { projection: { emailAddress: 1, inactive: 1, inactiveCustomerIds: 1 } }).toArray();

    const bulkOps = [];
    identities.forEach((identity) => {
      if (!identity.emailAddress) return;
      const filter = { _id: identity._id };
      const update = {
        $setOnInsert: filter,
        $set: {
          emailAddress: identity.emailAddress,
          inactive: identity.inactive,
          inactiveCustomerIds: identity.inactiveCustomerIds,
        },
      };
      bulkOps.push({ updateOne: { filter, update, upsert: true } });
    });
    if (bulkOps.length) await toColl.bulkWrite(bulkOps);
    log('Inactive identity migration complete!');
  })();

  await Promise.all([
    source.close(),
    destination.close(),
  ]);
};

run().catch((e) => setImmediate(() => { throw e; }));
