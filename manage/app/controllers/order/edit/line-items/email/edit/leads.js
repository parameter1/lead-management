import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { computed } from '@ember/object';

export default Controller.extend(FormMixin, {
  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),
});
