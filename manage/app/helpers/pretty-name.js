
import Helper from '@ember/component/helper';
import { inject } from '@ember/service';

export default Helper.extend({
  config: inject('config'),
  compute([unprettiedName]) {
    const config = this.get('config');
    if (['lynchm', 'indm'].includes(config.zone)) {
      return unprettiedName.replace(/^.+-.+-/, '');
    }
    return unprettiedName;
  }
});
