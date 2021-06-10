const express = require('express');
const exportData = require('./exports');

module.exports = (app) => {
  app.use('/export', exportData);
  app.use(express.static('public'));
};
