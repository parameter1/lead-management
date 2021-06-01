const mongodb = require('./index');
const { TENANT_KEY } = require('../env');

module.exports = mongodb.db({ name: `lead-management-${TENANT_KEY}` });
