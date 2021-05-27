const { Router } = require('express');
const { get } = require('object-path');
const createError = require('http-errors');
const EmailDeploymentHtml = require('../models/email-deployment-html');
const asyncRoute = require('../utils/async-route');
const mcRest = require('../marketing-cloud/rest');

const router = Router();

router.get('/:emailId', asyncRoute(async (req, res) => {
  const { emailId } = req.params;

  const criteria = {
    'externalSource.identifier': emailId,
    'externalSource.namespace': 'FuelSOAP:Email',
  };

  // attempt to find from the db.
  const deployment = await EmailDeploymentHtml.findOne(criteria);

  if (!deployment) {
    // load from the api.
    const asset = await mcRest.retrieveEmailAsset({ emailId, fields: ['views'] });
    if (!asset) throw createError(404, `No Email found for ID '${emailId}'`);
    const html = get(asset, 'views.html.content');
    if (!html) throw createError(500, `Unable to extract HTML for Email ID '${emailId}'`);
    // save to database
    await EmailDeploymentHtml.updateOne(criteria, {
      $setOnInsert: {
        ...criteria,
        body: html,
      },
    }, { upsert: true });
    res.send(html);
  } else {
    res.send(deployment.body);
  }
}));

module.exports = router;
