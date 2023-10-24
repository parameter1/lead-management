import Component from '@ember/component';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';

export default Component.extend(FormMixin, {
  identityAttributes: inject(),

  title: 'Exclude Leads Where...',
  filters: null,

  classNames: ['card'],

  actions: {
    addFilter(field) {
      const { key, label } = field;
      this.get('filters').pushObject({ key, label, matchType: 'matches', terms: [] });
      this.send('triggerChange');
    },
    removeFilter(index) {
      this.get('filters').removeAt(index);
      this.send('triggerChange');
    },
    triggerChange() {
      const filters = this.get('filters');
      this.get('on-change')(filters.map((filter) => {
        const { key, label, matchType, terms } = filter;
        return {
          key,
          label,
          matchType,
          terms,
        };
      }));
    },
    async appendExclusions(event) {
      this.startAction()
      try {
        event.preventDefault()
        const data = new FormData(event.target);
        const r = await fetch('/append-exclusions-to-campaign', {
          method: 'POST',
          body: data,
        });
        if (!r.ok) {
          const json = await r.json();
          if (json && json.message) throw new Error(json.message);
          throw new Error('A fatal error was encountered')
        }
        const jsonResponse = await r.json()
        this.get('filters').pushObject(jsonResponse);
        this.send('triggerChange');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    }
  },
});
