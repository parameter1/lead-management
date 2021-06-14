const env = require('../env');
const loaders = require('./dataloaders');
const brightcove = require('../brightcove/api');
const gam = require('./schema/gam/executor');

module.exports = ({ req }) => ({
  auth: req.auth,
  host: env.HOST_NAME,
  loaders,
  gam,
  brightcove,
});
