const merge = require('lodash.merge');
const objectPath = require('object-path');
const moment = require('moment-timezone');
const Fuel = require('../fuel/client');
const Identity = require('../models/identity');
const writeConcern = require('../utils/write-concern');

const { isArray } = Array;
const { keys } = Object;
const SUBSCRIBER_NAMESPACE = 'FuelSOAP:Subscriber';

const identityAttrMap = {
  EmailAddress: 'emailAddress',
  'Attributes.First Name': 'givenName',
  'Attributes.Last Name': 'familyName',
  'Attributes.Title': 'title',
  'Attributes.Company Name': 'companyName',
  'Attributes.Address': 'street',
  'Attributes.City': 'city',
  'Attributes.State': 'region',
  'Attributes.Zip': 'postalCode',
  'Attributes.Country': 'country',
  'Attributes.Phone Number': 'phoneNumber',
  'Attributes.Industry': 'attributes.Industry',
  'Attributes.Job Function': 'attributes.Job Function',
  'Attributes.NAICS Code': 'attributes.NAICS Code',
};

module.exports = {
  /**
   * Upserts an Identity document using an ExactTarget subscriber.
   *
   * @async
   * @param {string|number} subscriberId
   */
  async upsertIdentityFor(subscriberId) {
    const subscriber = await this.retrieveSubscriber(subscriberId);
    const { ID } = subscriber;

    const criteria = {
      'externalSource.namespace': SUBSCRIBER_NAMESPACE,
      'externalSource.identifier': String(ID),
    };
    const $setOnInsert = {
      'externalSource.createdAt': moment.tz(subscriber.CreatedDate, 'America/Denver').toDate(),
      ...criteria,
    };

    const doc = await Identity.findOneAndUpdate(
      criteria,
      { $setOnInsert },
      { upsert: true, new: true, writeConcern: writeConcern() },
    );
    const identity = await Identity.findOne({ _id: doc.id });

    identity.set('externalSource.lastRetrievedAt', new Date());
    const data = this.mapIdentityData(subscriber);
    keys(data).forEach((key) => identity.set(key, data[key]));
    return identity.save();
  },

  /**
   * Flattens ExactTarget subscriber array attributes into a single key/value object.
   *
   * @param {*} attributes
   */
  flattenAttributes(attributes) {
    const attrs = attributes && isArray(attributes) ? attributes : [];
    return attrs.reduce((obj, attr) => ({ ...obj, [attr.Name]: attr.Value }), {});
  },

  /**
   * Maps ExactTarget subscriber data to Identity model data.
   *
   * @param {object} subscriber
   */
  mapIdentityData(subscriber) {
    const Attributes = this.flattenAttributes(subscriber.Attributes);
    const formatted = merge({}, subscriber);
    formatted.Attributes = Attributes;
    const mapped = {};

    keys(identityAttrMap).forEach((theirKey) => {
      const ourKey = identityAttrMap[theirKey];
      const value = objectPath.get(formatted, theirKey);
      objectPath.set(mapped, ourKey, value || '');
    });
    return mapped;
  },

  /**
   * Retrieves a subscriber record from ExactTarget.
   *
   * @param {string} id
   */
  retrieveSubscriber(id) {
    const props = ['ID', 'EmailAddress', 'CreatedDate'];
    return Fuel.retrieveSubscriberById(id, props);
  },

  getIdentityAttrMap() {
    return identityAttrMap;
  },
};
