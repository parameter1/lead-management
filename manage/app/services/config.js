import Service from '@ember/service';
import { set } from '@ember/object';

export default Service.extend({
  zone: null,

  init() {
    this.modules = [];
    this.settings = [];
    this._super(...arguments)
  },

  load(data) {
    Object.keys(data).forEach(key => set(this, key, data[key]));
  },

  isModuleEnabled(key) {
    const found = this.modules.find((m) => m.key === key);
    if (found) return found.enabled;
    return false;
  },
  isSettingSet(key) {
    const found = this.settings.find((s) => s.key === key);
    if (found) return found.value;
    return null;
  }
});
