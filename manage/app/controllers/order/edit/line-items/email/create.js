import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import mutation from 'leads-manage/gql/mutations/order/line-item/create-email';

export default Controller.extend(FormMixin, {
  apollo: inject(),
  graphErrors: inject(),

  isEditorial: computed('model.{tags.@each.name,linkTypes.[]}', function() {
    const pr = this.get('model.tags').find(tag => tag.name === 'PR');
    const editorialLink = this.get('model.linkTypes').includes('Editorial');
    if (pr || editorialLink) return true;
    return false;
  }),

  actions: {
    async create() {
      this.startAction();
      try {
        const {
          name,
          requiredLeads,
          totalValue,
          range,
          excludedFields,
          requiredFields,
          linkTypes,
          tags,
          categories,
          identityFilters,
          notes,
        } = this.get('model');

        if (!linkTypes.length) {
          throw new Error('Please select at least one link type.');
        }
        if (!range.start || !range.end) {
          throw new Error('Please select a date range');
        }

        const input = {
          orderId: this.get('order.id'),
          name,
          requiredLeads: parseInt(requiredLeads, 10),
          totalValue: parseFloat(totalValue, 10),
          range: {
            start: range.start.valueOf(),
            end: range.end.valueOf(),
          },
          excludedFields,
          requiredFields,
          linkTypes,
          tagIds: tags.map(t => t.id),
          categoryIds: categories.map(c => c.id),
          identityFilters,
          notes,
        };
        const variables = { input };
        const refetchQueries = ['AllLineItemsForOrder'];
        await this.get('apollo').mutate({ mutation, variables, refetchQueries }, 'createEmailLineItem');
        await this.transitionToRoute('order.edit.line-items');
        this.get('notify').info('Email line item created successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }

    },

    setDateRange(range) {
      this.set('model.range', range);
    },

    setExcludedFields(fields) {
      this.set('model.excludedFields', fields);
    },

    setRequiredFields(fields) {
      this.set('model.requiredFields', fields);
    },

    setLinkTypes(types) {
      this.set('model.linkTypes', types);
    },

    setTags(tags) {
      this.set('model.tags', tags);
    },

    setCategories(categories) {
      this.set('model.categories', categories)
    },

    setIdentityFilters(filters) {
      this.set('model.identityFilters', filters);
    },
  },
});
