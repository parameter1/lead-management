const escapeRegex = require('escape-string-regexp');
const merge = require('lodash.merge');
const Pagination = require('./pagination');

class TypeAhead {
  constructor(field, term, criteria = {}, options = {}) {
    this.options = options;
    this.values = {};

    this.field = field;
    this.term = term;
    this.criteria = criteria;
  }

  set options(options = {}) {
    const defaults = { position: 'contains', escape: true, caseSensitive: false };
    this.opts = { ...defaults, ...options };
  }

  get options() {
    return { ...this.opts };
  }

  set field(field) {
    if (!field) throw new Error('A type ahead field must be specified.');
    this.values.field = field;
  }

  get field() {
    return this.values.field;
  }

  set term(term) {
    if (!term) throw new Error('A type ahead term must be specified.');
    this.values.term = term;
  }

  get term() {
    return this.values.term;
  }

  set criteria(criteria) {
    this.values.criteria = merge({}, criteria);
  }

  get criteria() {
    return merge({}, this.values.criteria);
  }

  paginate(Model, pagination = {}, options = {}) {
    const { criteria, sort } = this.buildCriteria();
    return new Pagination(Model, { pagination, criteria, sort }, options);
  }

  buildCriteria() {
    const { field, criteria } = this;
    const value = this.buildRegex();
    return {
      criteria: { ...criteria, [field]: value },
      sort: { field, order: 1 },
    };
  }

  buildRegex() {
    const { term } = this;
    const { position, escape, caseSensitive } = this.opts;
    let start = '';
    let end = '';
    if (position === 'starts-with') {
      start = '^';
    } else if (position === 'ends-with') {
      end = '$';
    } else if (position === 'exact-match') {
      start = '^';
      end = '$';
    }
    const value = escape ? escapeRegex(term) : term;
    const flags = caseSensitive ? undefined : 'i';
    return new RegExp(`${start}${value}${end}`, flags);
  }
}

module.exports = TypeAhead;
