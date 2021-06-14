const extractedHosts = require('./extracted-hosts');
const extractedUrls = require('./extracted-urls');

const transformers = new Map();
transformers.set('extracted-hosts', extractedHosts);
transformers.set('extracted-urls', extractedUrls);

module.exports = transformers;
