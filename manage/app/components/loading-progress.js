import Component from '@ember/component';
import { computed } from '@ember/object';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

export default Component.extend(LoadingMixin, {
  classNames: ['main', 'progress'],
  show: computed.readOnly('loadingDisplay.isShowing'),
});
