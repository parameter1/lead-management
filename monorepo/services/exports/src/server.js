const { server } = require('@parameter1/micro/json');
const actions = require('./actions');
const newrelic = require('./newrelic');
const apollo = require('./apollo');
const { name } = require('../package.json');

module.exports = server({
  name,
  actions,
  logErrors: ({ status }) => (status >= 500),
  onError: ({ e, status }) => {
    if (status >= 500) newrelic.noticeError(e);
  },
  context: async ({ input, req }) => {
    const { action } = input;
    newrelic.setTransactionName(action);
    return { apollo: apollo(), authorization: req.headers.authorization };
  },
});
