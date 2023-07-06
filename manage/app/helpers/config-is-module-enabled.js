import Helper from '@ember/component/helper';
import { inject } from '@ember/service';

export default Helper.extend({
  config: inject(),
  compute([key]) {
    return this.config.isModuleEnabled(key);
  },
});
