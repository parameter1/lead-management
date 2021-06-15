const { getAsArray } = require('@parameter1/utils');
const uniqueObjectIds = require('../utils/unique-object-ids');

const mergeVarMap = new Map([
  ['%%emailaddr%%', '@{delivery_email}@'],
  ['%%First Name%%', '@{first_name}@'],
  ['%%Last Name%%', '@{last_name}@'],
  ['%%Company Name%%', '@{company_name}@'],
  ['%%Title%%', '@{job_title}@'],
  ['%%Phone Number%%', '@{phone_number}@'],
  ['%%Address%%', '@{street_address}@'],
  ['%%City%%', '@{city}@'],
  ['%%State%%', '@{region}@'],
  ['%%Country%%', '@{country}@'],
  ['%%Zip%%', '@{postal_code}@'],
  ['%%Industry%%', '@{industry_code}@'],
  ['%%Job Function%%', '@{title_code}@'],
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
