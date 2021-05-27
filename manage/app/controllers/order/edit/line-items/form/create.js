import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';


import mutation from 'leads-manage/gql/mutations/order/line-item/create-form';

export default Controller.extend(FormMixin, {
  apollo: inject(),
  graphErrors: inject(),

  actions: {
    async create() {
      try {
        this.startAction();
        const {
          name,
          requiredLeads,
          totalValue,
          range,
          notes,
          form,
        } = this.get('model');

        if (!form || !form.id) {
          throw new Error('Please select a form to associate with this line item.');
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
          notes,
          formId: form.id,
        };
        const variables = { input };
        const refetchQueries = ['AllLineItemsForOrder'];
        await this.get('apollo').mutate({ mutation, variables, refetchQueries }, 'createFormLineItem');
        await this.transitionToRoute('order.edit.line-items');
        this.get('notify').info('Form line item created successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    setDateRange(range) {
      this.set('model.range', range);
    },

    setForm(form) {
      this.set('model.form', form);
    }
  },
});
