const { createHash } = require('crypto');

module.exports = (id) => createHash('md5').update(`${id}`).digest('hex');
