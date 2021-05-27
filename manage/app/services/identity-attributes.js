import Service, { inject } from '@ember/service';
import { computed, get } from '@ember/object';

export default Service.extend({
  user: inject(),

  adminFields: computed.filterBy('fields', 'adminOnly', true),

  getViewableFields: computed('fields.[]', function() {
    return this.get('fields').filter((field) => {
      if (get(field, 'adminOnly')) {
        return this.get('user.isAdmin') ? true : false;
      } else {
        return true;
      }
    });
  }),

  getFilteredFields(excluded) {
    return this.get('fields').reject((field) => excluded.indexOf(field.key) >= 0);
  },

  getFields() {
    return this.get('fields');
  },

  init() {
    this._super(...arguments);

    this.set('fields', [
      { key: 'emailAddress', label: 'Email' },
      { key: 'givenName', label: 'First Name' },
      { key: 'familyName', label: 'Last Name' },
      { key: 'title', label: 'Title' },
      { key: 'companyName', label: 'Company Name' },
      { key: 'street', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'region', label: 'State' },
      { key: 'postalCode', label: 'Postal Code' },
      { key: 'country', label: 'Country' },
      { key: 'phoneNumber', label: 'Phone #', adminOnly: true },
      { key: 'attributes.Industry', label: 'Industry' },
      { key: 'attributes.Job Function', label: 'Job Function' },
      { key: 'attributes.NAICS Code', label: 'NAICS' },
    ]);

    this.set('cardBlocks', [
      {
        title: 'Company Info',
        fields: [
          { key: 'title' },
          { key: 'companyName' },
        ]
      },
      {
        title: 'Contact Info',
        fields: [
          { key: 'street' },
          { key: 'city', inline: true },
          { key: 'region', inline: true },
          { key: 'postalCode', inline: true },
          { key: 'country' },
          { key: 'phoneNumber', label: 'Tel' },
        ]
      },
      {
        title: 'Attributes',
        fields: [
          { key: 'attributes.Industry', label: 'Industry' },
          { key: 'attributes.Job Function', label: 'Job Function' },
          { key: 'attributes.NAICS Code', label: 'NAICS' },
        ]
      },
    ]);
  },
});
