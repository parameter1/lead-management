const eachSeries = require('async/eachSeries');
const each = require('async/each');
const parallel = require('async/parallel');

module.exports = {
  /**
   *
   */
  eachSeriesPromise: (coll, iteratee) => new Promise((resolve, reject) => {
    eachSeries(coll, iteratee, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }),

  /**
   *
   */
  eachPromise: (coll, iteratee) => new Promise((resolve, reject) => {
    each(coll, iteratee, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }),

  /**
   *
   */
  parallelPromise: (tasks) => new Promise((resolve, reject) => {
    parallel(tasks, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }),
};
