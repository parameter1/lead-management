const jwt = require('jsonwebtoken');
const { v4: uuidv4, v5: uuidv5 } = require('uuid');
const bcrypt = require('bcryptjs');
const redis = require('../redis');

const SETTINGS = {
  // @todo Rotate the global secrets?
  globalSecret: '$2a$12$f6y.1RLxgHO/G8TU84rN/OnTwUiozKoih/nkf5BnXi75SAjYQ.ak6',
  saltRounds: 5, // For user secret bcrypt.
  namespace: 'b966dde2-7ca8-11e7-abc4-cec27ab6b50a', // Namespace for UUIDv5.
  expires: 60 * 60 * 24 * 30, // 30 days, in seconds.
  idPrefix: 'session:id', // Cache prefix.
  userPrefix: 'session:user', // Cache prefix.
};

function createSessionId({ uid, ts }) {
  return uuidv5(`${uid}.${ts}`, SETTINGS.namespace);
}

function createSecret({ userSecret }) {
  return `${userSecret}.${SETTINGS.globalSecret}`;
}

module.exports = {
  getClient() {
    return redis;
  },

  /**
   *
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.uid
   * @return {Promise}
   */
  async delete({ id, uid }) {
    const delSession = redis.del(`${SETTINGS.idPrefix}:${id}`);
    const removeId = redis.srem(`${SETTINGS.userPrefix}:${uid}`, id);
    return Promise.all([delSession, removeId]);
  },

  /**
   *
   * @param {string} token
   * @return {Promise}
   */
  async get(token) {
    if (!token) throw new Error('Unable to get session: no token was provided.');
    const parsed = await jwt.decode(token, { complete: true, force: true });
    if (!parsed) throw new Error('Unable to get session: invalid token format.');
    const result = await redis.get(`${SETTINGS.idPrefix}:${parsed.payload.jti}`);

    if (!result) throw new Error('Unable to get session: no token found in storage.');

    const session = Object(JSON.parse(result));
    const sid = createSessionId(session);
    const secret = createSecret({ userSecret: session.s });
    const verified = jwt.verify(token, secret, { jwtid: sid, algorithms: ['HS256'] });

    // Return the public session.
    return {
      id: sid,
      uid: session.uid,
      cre: verified.iat,
      exp: verified.exp,
      token,
    };
  },

  /**
   *
   * @param {object} params
   * @param {string} params.uid
   * @return {Promise}
   */
  async set({ uid }) {
    if (!uid) throw new Error('The user ID is required.');

    const now = new Date();
    const iat = Math.floor(now.valueOf() / 1000);

    const userSecret = await bcrypt.hash(uuidv4(), SETTINGS.saltRounds);

    const ts = now.valueOf();
    const sid = createSessionId({ uid, ts });
    const exp = iat + SETTINGS.expires;
    const secret = createSecret({ userSecret });
    const token = jwt.sign({ jti: sid, exp, iat }, secret);

    await redis.setex(`${SETTINGS.idPrefix}:${sid}`, SETTINGS.expires, JSON.stringify({
      id: sid,
      ts,
      uid,
      s: userSecret,
    }));

    const memberKey = `${SETTINGS.userPrefix}:${uid}`;
    const addUserId = redis.sadd(memberKey, sid);
    const updateExpires = redis.expire(memberKey, SETTINGS.expires);
    await Promise.all([addUserId, updateExpires]);

    // Return the public session.
    return {
      id: sid,
      uid,
      cre: iat,
      exp,
      token,
    };
  },
};
