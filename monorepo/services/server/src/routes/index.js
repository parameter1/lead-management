const express = require('express');
const asyncRoute = require('../utils/async-route');

const appendLeadData = require('./append-lead-data-to-csv');
const creative = require('./creative');
const exactTargetEmails = require('./exact-target-email-export');
const exportData = require('./exports');

const { OmedaEmailDeploymentHtml } = require('../mongodb/models');

module.exports = (app) => {
  app.use('/append-lead-data-to-csv', appendLeadData);
  app.use('/creative', creative);
  app.get('/email-deployment-html/:entity', asyncRoute(async (req, res) => {
    const { $tenant } = req;
    const { entity } = req.params;
    const splitNumber = 1;
    const doc = await OmedaEmailDeploymentHtml.findOne({ entity, split: splitNumber });
    res.set('content-type', 'text/html; charset=UTF-8');
    if (doc) return res.send(doc.html);
    const [, trackId] = entity.split('*');
    const response = await $tenant.omeda.resource('email').lookupEmailDeploymentContent({
      trackId,
      splitNumber,
      contentType: 'html',
    });
    const html = response.getBody();
    if (!html) return res.send('');
    await OmedaEmailDeploymentHtml.updateOne({ entity, split: splitNumber }, {
      $setOnInsert: { entity, split: splitNumber },
      $set: { html, lastRetrievedAt: new Date() },
    }, { upsert: true });
    return res.send(html);
  }));
  app.use('/export', exportData);
  app.use('/exact-target-email-export', exactTargetEmails);
  app.use(express.static('public'));
};
