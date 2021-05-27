import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import { ComponentQueryManager } from 'ember-apollo-client';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

import query from 'leads-manage/gql/queries/behavior/content-query/test';

export default Component.extend(LoadingMixin, ComponentQueryManager, {
  tagName: 'button',
  classNames: ['btn'],
  attributeBindings: ['disabled', 'type'],

  ohBehaveToken: inject(),

  type: 'button',
  disabled: computed.readOnly('isRunning'),

  isRunning: false,
  result: null,
  hasRun: false,

 async click() {
  this.set('isRunning', true);
  this.set('result', null);
  this.set('hasRun', false);
  this.showLoading();
  const { id } = this.get('model');
  const variables = { input: { id } };

  try {
    const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
    const context = { ohBehaveToken };
    const result = await this.get('apollo').watchQuery({
      query,
      variables,
      context,
      fetchPolicy: 'network-only'
    }, 'behaviorTestContentQuery');
    this.set('result', result);
  } catch (e) {
    this.get('graphErrors').show(e)
  } finally {
    this.hideLoading();
    this.set('hasRun', true);
    this.set('isRunning', false);
  }
 },

});
