const { Router } = require('express');
const passport = require('passport');
const { ApolloServer } = require('apollo-server-express');
const { STATUS_CODES } = require('http');
const { get, set } = require('@parameter1/utils');
const noCache = require('nocache');
const Auth = require('../classes/auth');
const Raven = require('../raven');
const context = require('./context');
const { isProduction } = require('../env');

const authenticate = () => (req, res, next) => {
  passport.authenticate('bearer', { session: false }, (err, { user, session } = {}) => {
    req.auth = new Auth({ user, session, err });
    if (user) Raven.setContext({ user: user.toObject() });
    next();
  })(req, res, next);
};

module.exports = ({ app, schema, path }) => {
  const router = Router();
  router.use(noCache());
  router.use(authenticate());
  const server = new ApolloServer({
    context,
    schema,
    tracing: false,
    cacheControl: false,
    introspection: true,
    debug: !isProduction,
    playground: !isProduction ? { endpoint: path } : false,
    formatError: (err) => {
      const code = get(err, 'extensions.exception.statusCode');
      if (code) set(err, 'extensions.code', STATUS_CODES[code].replace(/\s/g, '_').toUpperCase());
      return err;
    },
  });
  server.applyMiddleware({ app: router, path, bodyParserConfig: { limit: '1mb' } });
  app.use(router);
  return server;
};
