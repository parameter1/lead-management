const express = require('express');

const creative = require('./creative');
const exportData = require('./exports');

module.exports = (app) => {
  app.use('/creative', creative);
  app.use('/export', exportData);
  app.use(express.static('public'));
};
