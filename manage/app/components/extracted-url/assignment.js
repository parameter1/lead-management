import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed, get } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';

import urlCustomerMutation from 'leads-manage/gql/mutations/extracted-url-customer';
import urlTagsMutation from 'leads-manage/gql/mutations/extracted-url-tags';
import hostCustomerMutation from 'leads-manage/gql/mutations/extracted-host-customer';
import hostTagsMutation from 'leads-manage/gql/mutations/extracted-host-tags';

export default Component.extend(ComponentQueryManager, {
  classNames: ['card'],

   /**
   * Services
   */
  notify: inject(),
  graphErrors: inject(),

  /**
   * Public properties
   */
  value: null, // The extracted value, either a full URL or hostname.
  model: null, // The extracted assignment model (either a `extracted-url` or `extracted-host`)

  /**
   * Computed (private) properties
   */
  headerText: computed('scope', function() {
    return 'host' === this.get('scope') ? 'Track by Host' : 'Track by Exact URL';
  }),

  scope: computed('value', function() {
    const value = this.get('value');
    if (!value) {
      return;
    }
    return 0 === value.indexOf('http') ? 'url' : 'host';
  }),

  doSet(mutation, input, resultKey) {
    const variables = { input };
    return this.get('apollo').mutate({ mutation, variables }, resultKey);
  },

  setUrlCustomer(customer) {
    const customerId = customer ? get(customer, 'id') : null;
    const resultKey = 'extractedUrlCustomer';
    const input = { urlId: this.get('model.id'), customerId };
    return this.doSet(urlCustomerMutation, input, resultKey);
  },

  setUrlTags(tags) {
    const resultKey = 'extractedUrlTags';
    const input = { urlId: this.get('model.id'), tagIds: tags.map(tag => get(tag, 'id')) };
    return this.doSet(urlTagsMutation, input, resultKey);
  },

  setHostCustomer(customer) {
    const customerId = customer ? get(customer, 'id') : null;
    const resultKey = 'extractedHostCustomer';
    const input = { hostId: this.get('model.id'), customerId, };
    return this.doSet(hostCustomerMutation, input, resultKey);
  },

  setHostTags(tags) {
    const resultKey = 'extractedHostTags';
    const input = { hostId: this.get('model.id'), tagIds: tags.map(tag => get(tag, 'id')) };
    return this.doSet(hostTagsMutation, input, resultKey);
  },

  actions: {
    setCustomer(customer) {
      const promise = this.get('scope') === 'url' ? this.setUrlCustomer(customer) : this.setHostCustomer(customer);
      promise
        .then(() => this.get('notify').info('Customer successfully assigned.'))
        .catch(e => this.get('graphErrors').show(e))
      ;
    },
    setTags(tags) {
      const promise = this.get('scope') === 'url' ? this.setUrlTags(tags) : this.setHostTags(tags);
      promise
        .then(() => this.get('notify').info('Tags successfully assigned.'))
        .catch(e => this.get('graphErrors').show(e))
      ;
    },
  },

});
