const LineItem = require('./index');
const schema = require('../../schema/line-item/form');

module.exports = LineItem.discriminator('form-lineitem', schema);
