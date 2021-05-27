import Helper from '@ember/component/helper';
import { inject } from '@ember/service';

export default Helper.extend({
  user: inject(),

  compute([...roles]) {
    return this.get('user').roleIs(...roles);
  }
});
