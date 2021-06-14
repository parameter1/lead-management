const { getAsArray } = require('@parameter1/utils');
const uniqueObjectIds = require('../utils/unique-object-ids');

const mergeVarMap = new Map([
  ['%%emailaddr%%', '@{delivery_email}@'],
  ['%%First Name%%', '@{first_name}@'],
  ['%%Last Name%%', '@{last_name}@'],
  // the rest are temporary placeholders
  ['%%Company Name%%', '@{company_name}@'],
  ['%%Title%%', '@{title}@'],
  ['%%Phone Number%%', '@{phone}@'],
  ['%%Address%%', '@{street1}@'],
  ['%%City%%', '@{city}@'],
  ['%%State%%', '@{state_province_code}@'],
  ['%%Zip%%', '@{Zip}@'],
  ['%%Industry%%', '@{Industry}@'],
]);

const unqiueUrlParams = (doc) => {
  const urlParams = getAsArray(doc, 'urlParams');
  const paramMap = urlParams.reduce((m, { key, value: v }) => {
    m.set(key, v);
    return m;
  }, new Map());
  const newParams = [];
  paramMap.forEach((value, key) => {
    const newMergeVar = mergeVarMap.get(value);
    const v = newMergeVar || value;
    if (/^%%/.test(v)) {
      // exact target merge value.
      throw new Error('Unhandled ExactTarget merge variable detected.');
    }
    newParams.push({ key, value: v });
  });
  return newParams;
};

module.exports = (doc) => ({
  ...doc,
  tagIds: uniqueObjectIds(doc.tagIds),
  urlParams: unqiueUrlParams(doc),
});