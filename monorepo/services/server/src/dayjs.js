const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const weekOfYear = require('dayjs/plugin/weekOfYear');

module.exports = dayjs.extend(utc).extend(timezone).extend(advancedFormat).extend(weekOfYear);
