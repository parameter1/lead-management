const { AdCreative, EventAdCreative } = require('../mongodb/models');
const creativeService = require('./ad-creative');

module.exports = {
  async track({
    tracker,
    action,
    query,
  }) {
    const { cid, lid, idt } = query;
    // Do not process if no identity is present.
    if (!idt || !/[a-z0-9]{15}/i.test(idt)) return null;

    // Do not process on invalid `cid` or `lid` values;
    const shouldProcess = [cid, lid].every((id) => /^[a-z0-9]+$/i.test(id) && id !== '123456789');
    if (!shouldProcess) return null;

    const creative = await creativeService.getDetail({ cid, lid });
    console.log(creative);

    if (!creative) return null;

    // Track the event.
    const now = new Date();
    const event = new EventAdCreative({
      day: now,
      last: now,
      action,
      trackerId: tracker._id,
      idt: ,
      lid,
      cid,
    });
    // Save the event.
    await event.aggregateSave();

    // Upsert the creative details.
    const doc = new AdCreative({
      ...creative,
      trackerIds: [tracker._id],
      lastRetrievedAt: now,
    });
    return doc.aggregateSave();
  },
};
