const { Pagination, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Form = require('../../models/form');
const FormEntry = require('../../models/form-entry');
const FormRepo = require('../../repos/form');

const { isArray } = Array;

module.exports = {
  /**
   *
   */
  FormEntryConnection: paginationResolvers.connection,

  FormEntry: {
    form: (entry) => Form.findOne({ _id: entry.formId || null, deleted: false }),
    wufooValues: (entry, _, ctx) => {
      if (!isArray(ctx.form.fields)) return [];
      const fields = ctx.form.fields.filter((field) => /^Field/.test(field.ID));
      const { values } = entry;

      return fields.map((field) => {
        if (field.Type === 'checkbox') {
          // Return as a concatenated string of commas.
          return { field, value: field.SubFields.map((f) => values[f.ID]).filter((v) => v).join(', ') };
        }
        if (isArray(field.SubFields)) {
          // Return as a concatenated string of spaces.
          return { field, value: field.SubFields.map((f) => values[f.ID]).filter((v) => v).join(' ') };
        }
        return { field, value: values[field.ID] };
      });
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    allFormEntries: async (root, { input, pagination, sort }, ctx) => {
      // No auth: publically accessed.
      const {
        formId,
        suppressInactives,
        refresh,
        max,
        startDate,
        endDate,
      } = input;
      const form = await Form.findOne({ _id: formId || null, deleted: false });
      if (!form) throw new Error(`No form found for ID '${formId}'`);
      ctx.form = form;

      const { after } = pagination;
      const criteria = await FormRepo.buildEntryCriteriaFor(form, {
        suppressInactives,
        refreshEntries: refresh && !after,
        max,
        startDate,
        endDate,
      });
      return new Pagination(FormEntry, { pagination, sort, criteria });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    formEntryActivate: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      const entry = await FormEntry.findById(id);
      if (!entry) throw new Error(`No form entry found for ID '${id}'`);
      entry.inactive = false;
      return entry.save();
    },

    /**
     *
     */
    formEntryDeactivate: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      const entry = await FormEntry.findById(id);
      if (!entry) throw new Error(`No form entry found for ID '${id}'`);
      entry.inactive = true;
      return entry.save();
    },
  },
};
