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

const { log } = console;

const limit = 1000;
const collections = [
  'customers',
  'extracted-hosts',
  'extracted-urls',
  'tags',
  'users',
];

const source = new MongoDBClient({ url: SOURCE_MONGO_URI });
const destination = new MongoDBClient({ url: DESTINATION_MONGO_URI });

const run = async () => {
  log('Connection to MongoDB...');
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
        if (transformer) throw new Error('IMPLEMENT TRANSFORMER!');
        const { _id, ...rest } = doc;
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

  await Promise.all([
    source.close(),
    destination.close(),
  ]);
};

run().catch((e) => setImmediate(() => { throw e; }));
