import Component from '@ember/component';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import ActionMixin from 'leads-manage/mixins/action-mixin';
import mutation from 'leads-manage/gql/mutations/create-export';
import query from 'leads-manage/gql/queries/export-status';

export default Component.extend(ComponentQueryManager, ActionMixin, {
  disabled: computed.reads('isActionRunning'),

  id: null,
  url: null,
  status: null,

  interval: null,
  intervalMs: 5000,

  tagName: 'button',
  classNames: ["btn btn-lg btn-success"],
  classNameBindings: ['isActionRunning:btn-disabled'],
  role: 'button',
  attributeBindings: ['disabled', 'role'],

  openUrl(url) {
    const link = document.createElement('a');
    link.href = url;
    link.click();
  },

  abort(url) {
    clearInterval(this.interval);
    if (url) {
      this.get('notify').success('Report ready. If download does not begin automatically, click here to access.', {
        onClick: () => this.openUrl(url),
        autoClear: true,
        clearDuration: 15 * 60 * 1000, // 15m
      });
      this.openUrl(url);
    }
    this.hideLoading();
    this.endAction();
  },

  async click() {
    if (this.isActionRunning) return;
    this.get('notify').clear();

    this.startAction();
    const variables = {
      input: {
        action: this.action,
        hash: this.hash,
        name: this.name,
      }
    };
    const { id, url } = await this.get('apollo').mutate({ mutation, variables }, 'createExport');
    if (url) return this.abort(url);

    this.interval = setInterval(async () => {
      try {
        const { status, url: nurl } = await this.get('apollo').watchQuery({
          query,
          variables: { id },
          fetchPolicy: 'network-only',
        }, 'exportStatus');
        if (nurl) this.abort(nurl);
        if (status === 'errored') throw new Error('Unable to generate export. Please try again!');
      } catch (e) {
        this.get('graphErrors').show(e);
        this.abort();
      }
    }, this.intervalMs);
  }
});
