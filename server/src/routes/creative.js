const { Router } = require('express');
const createError = require('http-errors');
const noCache = require('nocache');
const newrelic = require('../newrelic');
const asyncRoute = require('../utils/async-route');
const creativeTracker = require('../services/creative-tracker');
const AdCreativeTracker = require('../mongodb/models/ad-creative-tracker');

const router = Router();
router.use(noCache());

const emptyGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

router.get('/:type/:trackerId([a-f0-9]{24})', asyncRoute(async (req, res) => {
  const { params, query } = req;

  const { type, trackerId } = params;
  const tracker = await AdCreativeTracker.findById(trackerId, { url: 1 });
  if (!tracker) throw createError(404, `No tracker found for ID '${trackerId}'`);
  const { url } = tracker;

  // Track the creative action, but do not await.
  const action = type === 'c' ? 'click' : 'impression';

  await creativeTracker.track({ tracker, action, query });
  res.json({ ok: true });
  // creativeTracker.track({
  //   tracker,
  //   action,
  //   query,
  // }).catch((e) => {
  //   newrelic.noticeError(e);
  // });

  // if (action === 'click') {
  //   res.redirect(301, url);
  // } else {
  //   res.set('Content-Type', 'image/gif');
  //   res.send(emptyGif);
  // }
}));

module.exports = router;
