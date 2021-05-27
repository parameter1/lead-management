const moment = require('moment-timezone');
const Form = require('../models/form');
const FormEntry = require('../models/form-entry');
const WufooProvider = require('../services/wufoo-provider');
const createDateCriteria = require('../utils/create-date-criteria');
const { eachPromise } = require('../utils/async');

const isEmpty = (v) => v === '' || v === undefined || v === null;
const { isArray } = Array;

module.exports = {
  async loadEntries(form) {
    const lastEntry = await this.getLastEntry(form.id);
    const pageSize = 100;

    const params = { pageSize, pageStart: 0 };
    if (lastEntry) {
      params.Filter1 = `EntryId Is_greater_than ${lastEntry.identifier}`;
    }

    const { identifier } = form.externalSource;
    const entries = await WufooProvider.retrieveFormEntries(identifier, params);
    await Promise.all(entries.map((entry) => this.upsertEntry(form.id, entry)));

    if (entries.length === pageSize) {
      // More entries. Run the query again again.
      await this.loadEntries(form);
    }
  },

  async upsertEntry(formId, entry) {
    const { keys } = Object;

    const { EntryId, DateCreated } = entry;
    const criteria = { formId, identifier: EntryId };

    const $setOnInsert = {
      formId,
      identifier: EntryId,
      inactive: false,
      submittedAt: moment.tz(DateCreated, 'America/Chicago').toDate(),
    };

    const attrs = { ...entry };
    delete attrs.EntryId;
    delete attrs.DateCreated;

    const values = {};
    keys(attrs).forEach((key) => {
      const value = attrs[key];
      if (!isEmpty(value)) values[key] = value;
    });
    const $set = { values, updatedAt: new Date() };

    return FormEntry.updateOne(criteria, { $set, $setOnInsert }, { upsert: true });
  },

  getLastEntry(formId) {
    return FormEntry.findOne({ formId }, { identifier: 1 }).sort({ identifier: -1 }).limit(1);
  },

  async findById(id) {
    const form = await Form.findOne({ _id: id || null, deleted: false });
    if (!form) throw new Error(`No form found for ID '${id}'`);
    return form;
  },

  async getEligibleCampaignForms(campaign, { refreshEntries = false } = {}) {
    if (!campaign) return [];

    // Find all eligble forms.
    // Where the campaign's customer matches, dates align, and form is not deleted
    const formCriteria = {
      customerId: campaign.customerId,
      deleted: false,
    };
    const dateCriteria = createDateCriteria(campaign);

    const forms = await Form.find(formCriteria, { _id: 1, externalSource: 1 });
    if (!forms) return [];

    // Now refresh entries, in parallel, if applicable.
    if (refreshEntries) {
      await eachPromise(forms, async (form) => this.loadEntries(form));
    }

    // Determine which forms have entries for the selected period.
    const entryCriteria = {
      formId: { $in: forms.map((f) => f.id) },
    };
    if (dateCriteria) entryCriteria.submittedAt = dateCriteria;
    const formIds = await FormEntry.distinct('formId', entryCriteria);

    // Return matching forms with entries.
    return Form.find({ _id: { $in: formIds } }).sort({ 'externalSource.createdAt': 1 });
  },

  createFilteredCriteria({ choiceFilters, inactive = false } = {}) {
    const criteria = {};
    if (!isArray(choiceFilters)) return criteria;
    const boolOp = inactive ? '$or' : '$and';
    const ops = choiceFilters
      .filter(({ fieldId, choices }) => fieldId && isArray(choices) && choices.length)
      .map((filter) => {
        const { fieldId, choices } = filter;
        const path = `values.${fieldId}`;
        const op = inactive ? '$nin' : '$in';
        return { [path]: { [op]: choices } };
      });

    ops.push({ inactive });
    criteria[boolOp] = ops;
    return criteria;
  },

  async buildEntryCriteriaFor(form, {
    suppressInactives,
    onlyInactive,
    refreshEntries,
    max,
    startDate,
    endDate,
    choiceFilters,
  } = {}) {
    if (refreshEntries) await this.loadEntries(form);

    let entryCriteria = { formId: form.id };
    if (onlyInactive) {
      entryCriteria = {
        ...entryCriteria,
        ...this.createFilteredCriteria({ choiceFilters, inactive: true }),
      };
    }
    if (suppressInactives) {
      entryCriteria = {
        ...entryCriteria,
        ...this.createFilteredCriteria({ choiceFilters, inactive: false }),
      };
    }
    const dateCriteria = createDateCriteria({ startDate, endDate });
    if (dateCriteria) entryCriteria.submittedAt = dateCriteria;
    if (!max) return entryCriteria;

    const limited = await FormEntry.find(entryCriteria).limit(max);
    return { _id: { $in: limited.map((o) => o.id) } };
  },

};
