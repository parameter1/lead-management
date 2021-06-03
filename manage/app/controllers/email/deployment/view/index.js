import Controller from '@ember/controller';
import { inject } from '@ember/service';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

import mutation from 'leads-manage/gql/mutations/refresh-email-send';

export default Controller.extend(LoadingMixin, {
  apollo: inject(),

  isRefreshing: false,

  actions: {
    refresh(id) {
      this.showLoading();
      this.set('isRefreshing', true);
      const variables = { input: { id } };
      return this.get('apollo').mutate({ mutation, variables }, 'refreshEmailSend')
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => {
          this.set('isRefreshing', false);
          this.hideLoading();
        })
      ;
    },
  },
});
