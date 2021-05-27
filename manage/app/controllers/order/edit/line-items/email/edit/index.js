import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import moment from 'moment';

export default Controller.extend(FormMixin, {
  identityAttributes: inject(),

  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),

  requiredFields: computed('identityAttributes.getViewableFields', 'model.requiredFields.[]', function() {
    const selected = this.get('model.requiredFields');
    return this.get('identityAttributes.getViewableFields').filter(o => selected.includes(o.key)).map(o => o.label);
  }),

  identityFilters: computed('identityAttributes.getViewableFields', 'model.identityFilters.[]', function() {
    const filters = this.get('model.identityFilters');
    const viewable = this.get('identityAttributes.fields');
    return filters.map((filter) => {
      const field = viewable.find(f => f.key === filter.key);
      return `${field.label} ${filter.matchType} "${filter.terms.join('" or "')}"`;
    });
  }),

  startsEnds: computed('model.range.{start,end}', function() {
    const now = Date.now();
    const start = this.get('model.range.start');
    const end = this.get('model.range.end');
    if (start > now) return `Starts ${moment().to(start)}`;
    if (end > now) return `Ends ${moment().to(end)}`;
  }),
});
