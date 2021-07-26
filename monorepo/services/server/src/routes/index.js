const express = require('express');

const creative = require('./creative');
const exactTargetEmails = require('./exact-target-email-export');
const exportData = require('./exports');

module.exports = (app) => {
  app.use('/creative', creative);
  app.use('/export', exportData);
  app.use('/exact-target-email-export', exactTargetEmails);
  app.use(express.static('public'));
};
