const LineItem = require('./index');
const schema = require('../../schema/line-item/email');

module.exports = LineItem.discriminator('email', schema);
