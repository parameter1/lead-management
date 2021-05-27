const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const EmailCategory = require('../../models/email-category');
const EmailDeployment = require('../../models/email-deployment');
const EmailSend = require('../../models/email-send');

module.exports = {
  /**
   *
   */
  EmailCategoryConnection: paginationResolvers.connection,

  /**
   *
   */
  EmailCategory: {
    /**
     *
     */
    parent: async (category, _, { loaders }) => {
      const { parentId } = category;
      if (!parentId) return null;
      return loaders.emailCategory.load(parentId);
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    allEmailCategories: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { hasDeployments: true };
      return new Pagination(EmailCategory, { pagination, sort, criteria });
    },

    /**
     *
     */
    emailCategory: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await EmailCategory.findById(id);
      if (!record) throw new Error(`No email category record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    searchEmailCategories: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
      return instance.paginate(EmailCategory, pagination);
    },
  },
  /**
   *
   */
  Mutation: {
    /**
     *
     */
    rollupEmailCatgoryMetrics: async (root, {
      categoryId,
      rollupMetrics,
      isNewsletter,
    }, { auth }) => {
      auth.check();
      const record = await EmailCategory.findById(categoryId);
      if (!record) throw new Error(`No email category record found for ID ${categoryId}.`);
      record.set('rollupMetrics', rollupMetrics);
      record.set('isNewsletter', isNewsletter);
      await record.save();

      // Now update all deployments and their sends to reflect the rollup and newsletter flag
      const deployments = await EmailDeployment.find({ categoryId: record.id }, { _id: 1 });
      const deploymentIds = deployments.map((d) => d.id);
      await EmailDeployment.updateMany({ _id: { $in: deploymentIds } }, {
        $set: { rollupMetrics, isNewsletter },
      });
      await EmailSend.updateMany({ deploymentId: { $in: deploymentIds } }, {
        $set: { rollupMetrics, isNewsletter },
      });
      return record;
    },
  },
};
