const express = require('express');
const click = require('./click');
const creative = require('./creative');
const deploymentHtml = require('./deployment-html');
const exportLeads = require('./export');
const interact = require('./interact');

module.exports = (app) => {
  app.use('/creative', creative);
  app.use('/deployment-html', deploymentHtml);
  app.use('/click', click);
  app.use('/export', exportLeads);
  app.use('/interact', interact);

  app.use(express.static('public'));
};
