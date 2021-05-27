import Component from '@ember/component';
import { get } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import query from 'leads-manage/gql/queries/line-item/progress';

export default Component.extend(ComponentQueryManager, ActionMixin, {
  init() {
    this._super(...arguments);
    this.set('qualified', {});
    this.set('scrubbed', {});
    this.set('pacing', {});
  },

  didInsertElement() {
    this.load();
  },

  async load() {
    this.startAction();
    const input = { id: this.get('lineItemId') };
    const variables = { input };
    try {
      const results = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'lineItem');
      this.set('qualified', get(results, 'progress.qualified'));
      this.set('scrubbed', get(results, 'progress.scrubbed'));
      this.set('pacing', get(results, 'progress.pacing'));
    } catch (e) {
      this.get('graphErrors').show(e);
    } finally {
      this.endAction();
    }
  },
});
