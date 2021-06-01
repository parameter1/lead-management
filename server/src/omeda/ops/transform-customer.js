const { get } = require('@parameter1/utils');

const getEmailDomain = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  return parts[1].trim().toLowerCase();
};

const g = (obj, path, def = '') => {
  const value = get(obj, path);
  return value || def;
};

const getFieldCount = (obj) => Object.keys(obj).filter((k) => obj[k]).length;

module.exports = ({
  entity,
  data,
  emails,
  phoneNumbers,
  postalAddresses,
}) => {
  const now = new Date();
  const primaryEmail = emails.getPrimary();
  const primaryPhone = phoneNumbers.getPrimary();
  const primaryAddress = postalAddresses.getPrimary();
  const companyName = postalAddresses.getCompanyName();

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

  const filter = { entity };
  const $set = {
    ...fields,
    emailDomain: getEmailDomain(fields.emailAddress),
    fieldCount: getFieldCount(fields) + getFieldCount(attributes),
    attributes,
    data: {
      ...data,
      Emails: emails.data,
      PhoneNumbers: phoneNumbers.data,
      Addresses: postalAddresses.data,
    },
    updatedAt: now,
  };
  const $setOnInsert = {
    ...filter,
    createdAt: now,
    inactive: false,
    inactiveCustomerIds: [],
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
