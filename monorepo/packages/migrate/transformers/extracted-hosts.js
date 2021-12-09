const { getAsArray } = require('@parameter1/utils');
const isOwnedSite = require('../utils/is-owned-site');
const uniqueObjectIds = require('../utils/unique-object-ids');

const unqiueUrlParams = (doc) => {
  const urlParams = getAsArray(doc, 'urlParams');
  const { value: hostname } = doc;

  const paramMap = urlParams.reduce((m, { key, value: v }) => {
    m.set(key, v);
    return m;
  }, new Map());

  if (isOwnedSite(hostname)) {
    paramMap.set('__lt-usr', '@{encrypted_customer_id}@');
    paramMap.set('utm_source', '@{track_id}@');
    paramMap.set('utm_medium', 'email');
    paramMap.set('utm_campaign', '@{mv_date_MMddyyyy}@');
    paramMap.set('utm_term', '@{track_id}@');
  } else {
    paramMap.set('utm_source', 'Industrial Media');
    paramMap.set('utm_medium', 'email');
    paramMap.set('utm_campaign', '@{mv_date_MMddyyyy}@');
    paramMap.set('utm_term', '@{track_id}@');
  }
  const newParams = [];
  paramMap.forEach((value, key) => {
    let v = value;
    if (value === '%%emailaddr%%') v = '@{delivery_email}@';
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
