const { getAsArray } = require('@parameter1/utils');
const MongoDBClient = require('@parameter1/mongodb/client');
const { ObjectId } = require('@parameter1/mongodb');
const { MONGO_DSN } = require('../env');
const omeda = require('./client');

const mongodb = new MongoDBClient({ url: MONGO_DSN });
const { log } = console;
const pattern = /lt\.lid=([a-f0-9]{24})/;

module.exports = async ({ trackId } = {}) => {
  log(`Syncing click data for ${trackId}...`);
  const db = await mongodb.db({ name: 'lead-management' });
  const { data } = await omeda.resource('email').searchClicks({ trackId });
  if (data) {
    const customerIdSet = new Set();
    const urlIdSet = new Set();
    const clickOps = [];
    getAsArray(data, 'splits').forEach((split) => {
      getAsArray(split, 'links').forEach((link) => {
        const matches = pattern.exec(link.LinkURL);
        // console.log(link.LinkURL);
        if (!matches) return;
        urlIdSet.add(matches[1]);
        const urlId = new ObjectId(matches[1]);
        getAsArray(link, 'clicks').forEach((click) => {
          // console.log(click);
          const { EncryptedCustomerId, ClickDate } = click;
          // @todo do we also allow just email address + name???
          if (!EncryptedCustomerId) return;
          customerIdSet.add(EncryptedCustomerId);
          const filter = {
            urlId,
            encryptedCustomerId: EncryptedCustomerId,
            trackId,
            split: split.Split,
          };
          clickOps.push({
            updateOne: {
              filter,
              update: {
                $setOnInsert: filter,
                $set: { date: ClickDate, n: click.NumberOfClicks },
              },
              upsert: true,
            },
          });
        });
      });
    });
    log(`Found ${clickOps.length} clicks to upsert for ${trackId}...`);
    if (clickOps.length) db.collection('omeda-email-clicks').bulkWrite(clickOps);
    // console.log(customerIdSet); // sync these
    // console.log(urlIdSet); // get data for these.. and append to ops??
  } else {
    log(`No click data found for ${trackId}`);
  }
  log(`Click data sync complete for ${trackId}`);
};
