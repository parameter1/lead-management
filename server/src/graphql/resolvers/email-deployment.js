const { Pagination, TypeAhead, paginationResolvers } = require('../pagination');
const { OmedaEmailDeployment } = require('../../mongodb/models');

const metricMap = new Map([
  ['sent', 'RecipientCount'],
  ['delivered', 'SentCount'],
  ['opens', 'TotalOpens'],
  ['clicks', 'TotalClicks'],
  ['uniqueOpens', 'UniqueOpens'],
  ['uniqueClicks', 'UniqueClicks'],
  ['unsubscribes', 'TotalUnsubscribe'],
  ['bounces', 'BounceCount'],
]);

module.exports = {
  /**
   *
   */
  EmailDeployment: {
    createdAt: (dep) => dep.get('omeda.CreatedDate'),
    designation: (dep) => dep.get('omeda.DeploymentDesignation'),
    name: (dep) => dep.get('omeda.DeploymentName'),
    sentDate: (dep) => dep.get('omeda.SentDate'),
    splitCount: (dep) => dep.get('omeda.SplitCount') || 0,
    status: (dep) => dep.get('omeda.Status'),
    subject: (dep) => dep.get('omeda.Splits.0.EmailSubject'),
    typeDescription: (dep) => dep.get('omeda.DeploymentTypeDescription'),
    typeId: (dep) => dep.get('omeda.DeploymentTypeId'),
    metrics: async (dep) => {
      const metrics = {};
      metricMap.forEach((omedaKey, ourKey) => {
        const value = dep.get(`omeda.${omedaKey}`) || 0;
        metrics[ourKey] = value;
      });

      metrics.deliveryRate = metrics.sent ? metrics.delivered / metrics.sent : 0;
      metrics.openRate = metrics.delivered ? metrics.uniqueOpens / metrics.delivered : 0;
      metrics.clickToDeliveredRate = metrics.delivered
        ? metrics.uniqueClicks / metrics.delivered : 0;
      metrics.clickToOpenRate = metrics.uniqueOpens
        ? metrics.uniqueClicks / metrics.uniqueOpens : 0;
      return metrics;
    },
    splits: (dep) => dep.get('omeda.Splits') || [],
  },

  /**
   *
   */
  EmailDeploymentSplit: {
    fromName: (split) => split.FromName,
    fromEmail: (split) => split.FromEmail,
    subject: (split) => split.EmailSubject,
  },

  /**
   *
   */
  EmailDeploymentConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    emailDeployment: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await OmedaEmailDeployment.findById(id);
      if (!record) throw new Error(`No email deployment record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allEmailDeployments: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(OmedaEmailDeployment, { pagination, sort });
    },

    /**
     *
     */
    searchEmailDeployments: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
      return instance.paginate(OmedaEmailDeployment, pagination);
    },
  },
};
