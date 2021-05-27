const { OAuth2 } = require('oauth');
const { BRIGHTCOVE_APP_ID, BRIGHTCOVE_SECRET } = require('../../env');

const oauth = new OAuth2(BRIGHTCOVE_APP_ID, BRIGHTCOVE_SECRET, 'https://oauth.brightcove.com/', null, 'v4/access_token');

module.exports = () => new Promise((resolve, reject) => {
  oauth.getOAuthAccessToken('', { grant_type: 'client_credentials' }, (e, accessToken, refreshToken, results) => {
    if (e) {
      reject(e);
    } else {
      resolve(results);
    }
  });
});
