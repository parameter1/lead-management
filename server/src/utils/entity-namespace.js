const { dasherize } = require('./inflector');

const { assign } = Object;

const toArray = ({ z, b, n } = {}) => [z, b, n];

const isEmpty = ({ z, b, n } = {}) => Boolean(!z && !b && !n);

module.exports = {
  toArray,
  isEmpty,

  make(...args) {
    const map = { 0: 'z', 1: 'b', 2: 'n' };
    while (args.length < 3) {
      args.unshift(undefined);
    }
    const opts = args.reduce((obj, val, idx) => {
      const key = map[idx];
      if (key) assign(obj, { [key]: dasherize(val) });
      return obj;
    }, {});
    return opts;
  },

  toString({ z, b, n } = {}) {
    if (isEmpty({ z, b, n })) return '';
    return toArray({ z, b, n }).join('.');
  },

  isValid({ n } = {}) {
    return Boolean(n);
  },
};
