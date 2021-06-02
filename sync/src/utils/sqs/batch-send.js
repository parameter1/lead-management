const chunkArray = require('../chunk-array');
const queueUrl = require('./queue-url');
const sqs = require('../../sqs');

/**
 *
 * @param {object} params
 * @param {array} params.values An array of values to send
 * @param {string} params.queueName The queue name to send the messages to, e.g. `upsert-sends`
 * @param {function} [params.builder] A function convert each array item to an SQS message
 */
module.exports = async ({
  values,
  queueName,
  builder,
}) => {
  if (!queueName) throw new Error('A queue name is required.');

  return Promise.all(chunkArray(
    values,
    10,
    builder,
    (entries) => {
      const params = {
        QueueUrl: queueUrl({ name: queueName }),
        Entries: entries,
      };
      return sqs.sendMessageBatch(params).promise().then((res) => {
        const { Failed } = res;
        if (Failed.length) {
          const err = new Error(`Encountered failed '${queueName}' messages.`);
          err.failed = Failed;
          throw err;
        }
        return res;
      });
    },
  ));
};
