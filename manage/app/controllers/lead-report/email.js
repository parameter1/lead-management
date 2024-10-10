import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { computed, set } from '@ember/object';

export default Controller.extend({
  user: inject(),

  displayClickFilterOptions: computed('model.hasCustomClickFilter', 'user.isAdmin', function() {
    if (!this.get('user.isAdmin')) {
      return false;
    }
    return Boolean(this.get('model.hasCustomClickFilter'));
  }),

  init() {
    this._super(...arguments);

    const queryKeys = Object.keys(Object.fromEntries(new URLSearchParams(window.location.search)));
    this.set('queryParams', queryKeys);
  },

  actions: {
    applyFilterRules() {
      const { clickFilterRules } = this.get('model');
      const query = clickFilterRules.reduce((params, entry) => {
        const { allowUnrealCodes } = entry;
        const codes = Array.isArray(allowUnrealCodes)
          ? allowUnrealCodes.join(',')
          : allowUnrealCodes

        params.set(entry.seconds, codes);
        return params;
      }, new URLSearchParams({
        ...(clickFilterRules.length && { customClickFilter: true }),
      }));
      window.location.search = query;
    },

    addNewFilterRule() {
      const model = this.get('model');
      const entries = [...model.clickFilterRules];
      entries.push({ allowUnrealCodes: [] });
      set(model, 'clickFilterRules', entries);
    },

    removeFilterRule(index) {
      const model = this.get('model');
      set(model, 'clickFilterRules', model.clickFilterRules.filter((_, i) => i !== index));
    }
  },
});
