import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';


export default Controller.extend(FormMixin, {
  apollo: inject(),
});
