const AdCreative = require('../models/ad-creative');
const EventAdCreative = require('../models/events/ad-creative');
const creativeService = require('./ad-creative');

module.exports = {
  async track({
    tracker,
    action,
    cookies,
    query,
  }) {
    const { cid, lid, usr } = query;
    const subscriberFromCookie = parseInt((cookies || {})['et-usr'], 10);
    const subscriberFromQuery = parseInt(usr, 10);
    // Do not process if no identity is present.
    if (!subscriberFromCookie && !subscriberFromQuery) return null;

    const shouldProcess = [cid, lid].reduce((bool, value) => {
      if (bool === false) return false;
      return /^[a-z0-9]+$/i.test(value) && value !== '123456789';
    }, true);
    // Do not process on invalid `cid` or `lid` values;
    if (!shouldProcess) return null;

    const { creative } = await creativeService.getDetail({ cid, lid });
    if (!creative) return null;

    // Track the event.
    const now = new Date();
    const event = new EventAdCreative({
      day: now,
      last: now,
      action,
      trackerId: tracker._id,
      usr: subscriberFromQuery || subscriberFromCookie,
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
