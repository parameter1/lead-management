const { Router } = require('express');
const createError = require('http-errors');
const noCache = require('nocache');
const asyncRoute = require('../utils/async-route');
const ExtractedUrl = require('../models/extracted-url');
const UrlManager = require('../services/url-manager');

const router = Router();
router.use(noCache());

/**
 * This is a legacy route. Click tracking is no longer handled directly by the server.
 * This is hear to ensure old tracked URLs still redirect.
 */
router.get('/:urlId([a-f0-9]{24})', asyncRoute(async (req, res) => {
  const { urlId } = req.params;
  const { mv } = req.query;
  const url = await ExtractedUrl.findOne({ _id: urlId });
  if (!url) throw createError(404, `No URL found for ID '${urlId}'`);
  const redirect = url.get('values.original');
  if (!redirect) throw createError(500, `No URL redirect found for ID '${urlId}'`);

  // Get the filled merge params from the URL and the `mv` query property.
  const urlParams = await UrlManager.getFilledParamsFor(url, mv);
  const redirectWithParams = UrlManager.injectParamsIntoUrl(redirect, urlParams);

  // Redirect.
  const disableRedirect = req.get('x-disable-redirect');
  if (disableRedirect) {
    res.json({
      location: redirectWithParams,
    });
  } else {
    res.redirect(301, redirectWithParams);
  }
}));

module.exports = router;
