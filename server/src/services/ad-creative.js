const fetch = require('node-fetch');
const { GAM_SERVICE_URL } = require('../env');

module.exports = {
  async getDetail({ cid, lid } = {}) {
    if (!cid || !lid) throw new Error('The creative and lineitem IDs are required.');

    // creative-detail/{lineitem-id}/{creative-id}
    const url = `${GAM_SERVICE_URL}/creative-detail/${lid}/${cid}`;
    const res = await fetch(url, {
      method: 'GET',
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Error from GAM service.');
    return json;
  },
};
