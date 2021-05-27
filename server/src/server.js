const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const Raven = require('./raven');
const authStrategies = require('./auth-strategies');
const routes = require('./routes');
const { TRUSTED_PROXIES } = require('./env');

// Set the auth strategies
passport.use(authStrategies.bearer);

const server = express();

const proxies = ['loopback', 'linklocal', 'uniquelocal'];
if (TRUSTED_PROXIES) {
  TRUSTED_PROXIES.split(',').map((p) => p.trim()).filter((p) => p).forEach((p) => proxies.push(p));
}
server.set('trust proxy', proxies);
server.use(Raven.requestHandler());
server.use(passport.initialize());
server.use(cookieParser());
server.use(helmet({ contentSecurityPolicy: false }));

routes(server);

server.get('/', (req, res) => {
  res.redirect(301, '/app');
});

module.exports = server;
