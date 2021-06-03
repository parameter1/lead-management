const { get } = require('@parameter1/utils');
const getEmailDomain = require('../utils/get-email-domain');

const g = (obj, path, def = '') => {
  const value = get(obj, path);
  return value || def;
};

const getFieldCount = (obj) => Object.keys(obj).filter((k) => obj[k]).length;

/**
 * Transforms an Omeda customer response into a DB bulk write operation.
 *
 * @param {object} params
 * @param {string} params.entity
 */
module.exports = ({
  entity,
  data,
  emails,
  phoneNumbers,
  postalAddresses,
  legacyInactiveMap = new Map(),
  excludedDomainMap = new Map(),
}) => {
  const now = new Date();
  const primaryEmail = emails ? emails.getPrimary() : null;
  const primaryPhone = phoneNumbers ? phoneNumbers.getPrimary() : null;
  const primaryAddress = phoneNumbers ? postalAddresses.getPrimary() : null;
  const companyName = postalAddresses ? postalAddresses.getCompanyName() : null;

  const fields = {
    emailAddress: g(primaryEmail, 'EmailAddress').toLowerCase(),
    givenName: g(data, 'FirstName'),
    familyName: g(data, 'LastName'),
    title: g(data, 'Title'),
    companyName: companyName || '',
    phoneNumber: g(primaryPhone, 'PhoneNumber'),
    street: g(primaryAddress, 'Street'),
    streetExtra: g(primaryAddress, 'ExtraAddress'),
    city: g(primaryAddress, 'City'),
    region: g(primaryAddress, 'RegionCode') || g(primaryAddress, 'Region'),
    postalCode: g(primaryAddress, 'PostalCode'),
    country: g(primaryAddress, 'CountryCode') || g(primaryAddress, 'Country'),
  };
  const attributes = {}; // @todo change this to use demographics

  const emailDomain = getEmailDomain(fields.emailAddress);

  const filter = { entity };
  const $set = {
    ...fields,
    emailDomain,
    domainExcluded: excludedDomainMap.has(emailDomain),
    fieldCount: getFieldCount(fields) + getFieldCount(attributes),
    attributes,
    omeda: {
      ...data,
      ...(emails && { Emails: emails.data }),
      ...(phoneNumbers && { PhoneNumbers: phoneNumbers.data }),
      ...(postalAddresses && { Addresses: postalAddresses.data }),
    },
    updatedAt: now,
    lastRetrievedAt: now,
  };

  const legacyInactiveEntry = fields.emailAddress
    ? legacyInactiveMap.get(fields.emailAddress) : undefined;

  const $setOnInsert = {
    ...filter,
    createdAt: now,
    ...(legacyInactiveEntry || { inactive: false, inactiveCustomerIds: [] }),
    inactiveCampaignIds: [],
    inactiveLineItemIds: [],
  };
  return {
    updateOne: {
      filter,
      update: { $setOnInsert, $set },
      upsert: true,
    },
  };
};
