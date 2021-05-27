import Component from '@ember/component';
import { inject } from '@ember/service';
import { isArray } from '@ember/array';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';

import urlParamsMutation from 'leads-manage/gql/mutations/extracted-url-params';
import hostParamsMutation from 'leads-manage/gql/mutations/extracted-host-params';

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
  modelId: null,
  value: null, // The extracted value, either a full URL or hostname.
  urlParams: null, // The assigned url parameters

  headerText: computed('scope', function() {
    return 'host' === this.get('scope') ? 'Params for Host' : 'Params for Exact URL';
  }),

  scope: computed('value', function() {
    const value = this.get('value');
    if (!value) {
      return;
    }
    return 0 === value.indexOf('http') ? 'url' : 'host';
  }),

  params: computed('urlParams.[]', function() {
    return this.get('urlParams').map((param) => {
      const { key, value } = param;
      return { key, value };
    });
  }),

  init() {
    this._super(...arguments);
    const urlParams = this.get('urlParams');
    const params = isArray(urlParams) ? urlParams : [];
    this.set('urlParams', params);
  },

  doSet(mutation, input, resultKey) {
    const variables = { input };
    return this.get('apollo').mutate({ mutation, variables }, resultKey);
  },

  setUrlParams(params) {
    const resultKey = 'extractedUrlParams';
    const input = { urlId: this.get('modelId'), params };
    return this.doSet(urlParamsMutation, input, resultKey);
  },

  setHostParams(params) {
    const resultKey = 'extractedHostParams';
    const input = { hostId: this.get('modelId'), params };
    return this.doSet(hostParamsMutation, input, resultKey);
  },

  actions: {
    add() {
      this.get('params').pushObject({ key: '', value: '' });
    },
    pop(index) {
      // Confirm removal and save.
      // @todo Should use a more elegant confirmation.
      if (window.confirm('Are you sure you want to remove this parameter?')) {
        this.get('params').removeAt(index);
        this.send('saveParams');
      }
    },
    saveParams() {
      const params = this.get('params').filter(param => param.key.trim());
      const promise = this.get('scope') === 'url' ? this.setUrlParams(params) : this.setHostParams(params);
      promise
        .then(() => this.get('notify').info('Params successfully assigned.'))
        .catch(e => this.get('graphErrors').show(e))
      ;
    },
  },

});
