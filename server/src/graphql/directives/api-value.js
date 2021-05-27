/* eslint-disable no-param-reassign */
const { SchemaDirectiveVisitor } = require('apollo-server-express');
const { get, getAsArray, getAsObject } = require('@parameter1/utils');

class ApiValueDirective extends SchemaDirectiveVisitor {
  /**
   *
   * @param {*} field
   */
  visitFieldDefinition(field) {
    field.resolve = async (obj) => {
      const { path } = this.args;
      switch (this.args.as) {
        case 'ARRAY':
          return getAsArray(obj, path);
        case 'OBJECT':
          return getAsObject(obj, path);
        default:
          return get(obj, path);
      }
    };
  }
}

module.exports = ApiValueDirective;
