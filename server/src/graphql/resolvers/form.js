const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Form = require('../../models/form');
const FormRepo = require('../../repos/form');
const FormEntry = require('../../models/form-entry');
const Customer = require('../../models/customer');
const wufooProvider = require('../../services/wufoo-provider');

const { isArray } = Array;

module.exports = {
  /**
   *
   */
  FormConnection: paginationResolvers.connection,

  Form: {
    customer: (form) => Customer.findOne({ _id: form.customerId || null, deleted: false }),
    createdAt: (form) => form.externalSource.createdAt,
    entries: async (form, { input, pagination, sort }, ctx) => {
      const {
        suppressInactives,
        refresh,
        max,
        startDate,
        endDate,
      } = input;
      ctx.form = form;

      const { after } = pagination;
      const criteria = await FormRepo.buildEntryCriteriaFor(form, {
        suppressInactives,
        refreshEntries: refresh && !after,
        max,
        startDate,
        endDate,
      });
      return new Pagination(FormEntry, { pagination, criteria, sort });
    },
    wufooFields: async (form, { input }) => {
      const { refresh, choicesOnly } = input;
      if (refresh) {
        await wufooProvider.setFormFields(form);
        await form.save();
      }
      // @todo handle checkboxes. they are technically subfields, not choices.
      const choiceFields = ['radio', 'select'];
      const fields = isArray(form.fields) ? form.fields.filter((field) => /^Field/.test(field.ID)) : [];
      if (choicesOnly) return fields.filter((field) => choiceFields.includes(field.Type));
      return fields;
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    form: async (root, { input }) => {
      // No auth: publically accessed.
      const { id, refreshEntries } = input;
      const form = await FormRepo.findById(id);
      if (refreshEntries) {
        await FormRepo.loadEntries(form);
      }
      return form;
    },

    /**
     *
     */
    allForms: (root, { input, pagination, sort }, { auth }) => {
      auth.check();
      const { customerIds } = input;
      const criteria = { deleted: false };
      if (customerIds.length) criteria.customerId = { $in: customerIds };
      return new Pagination(Form, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchForms: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, { deleted: false }, options);
      return instance.paginate(Form, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createForm: (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { payload } = input;
      const { customerId, externalSource } = payload;
      const record = new Form({ customerId, externalSource });
      return record.save();
    },

    /**
     *
     */
    updateForm: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id, payload } = input;
      const { customerId, externalSource } = payload;
      const record = await Form.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No form record found for ID ${id}.`);
      record.set({ customerId, externalSource });
      return record.save();
    },

    /**
     *
     */
    deleteForm: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      const record = await Form.findById(id);
      if (!record) throw new Error(`No form record found for ID ${id}.`);
      record.deleted = true;
      await record.save();
      return 'ok';
    },
  },
};
