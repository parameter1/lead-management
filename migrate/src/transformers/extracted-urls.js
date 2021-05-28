const { getAsArray } = require('@parameter1/utils');

const mergeVarMap = new Map([
  ['%%emailaddr%%', '@{delivery_email}@'],
  ['%%First Name%%', '@{First Name}@'],
  ['%%Last Name%%', '@{Last Name}@'],
  // the rest are temporary placeholders
  ['%%Company Name%%', '@{Company Name}@'],
  ['%%Title%%', '@{Title}@'],
  ['%%Phone Number%%', '@{Phone Number}@'],
  ['%%Address%%', '@{Address}@'],
  ['%%City%%', '@{City}@'],
  ['%%State%%', '@{State}@'],
  ['%%Zip%%', '@{Zip}@'],
  ['%%Industry%%', '@{Industry}@'],
]);

module.exports = (doc) => {
  const urlParams = getAsArray(doc, 'urlParams');
  if (!urlParams.length) return doc;

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
  return { ...doc, urlParams: newParams };
};
