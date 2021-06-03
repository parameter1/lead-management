const { asArray } = require('@parameter1/utils');
const { ObjectId } = require('@parameter1/mongodb');

module.exports = (values) => {
  const ids = asArray(values).reduce((set, oid) => {
    set.add(`${oid}`);
    return set;
  }, new Set());
  return [...ids].map((id) => new ObjectId(id));
};
