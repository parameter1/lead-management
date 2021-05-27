const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const moment = require('moment-timezone');
const emailDeploymentReportService = require('../../services/email-deployment-report');
const EmailDeployment = require('../../models/email-deployment');
const EmailSend = require('../../models/email-send');

const { keys, assign } = Object;

module.exports = {
  /**
   *
   */
  EmailDeployment: {
    sendCount: async (deployment) => {
      const count = await EmailSend.countDocuments({ deploymentId: deployment.id });
      return count || 0;
    },
    sends: (deployment) => EmailSend.find({ deploymentId: deployment.id }),
    metrics: async (deployment) => {
      const sends = await EmailSend.find({
        isTestSend: false,
        deploymentId: deployment.id,
      }, { metrics: 1 });

      const totals = sends.map((send) => send.metrics).reduce((agg, row) => {
        keys(agg).forEach((key) => assign(agg, { [key]: agg[key] + row[key] || 0 }));
        return agg;
      }, {
        sent: 0,
        delivered: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        unsubscribes: 0,
        bounces: 0,
      });
      totals.deliveryRate = totals.sent ? totals.delivered / totals.sent : 0;
      totals.openRate = totals.delivered ? totals.uniqueOpens / totals.delivered : 0;
      totals.clickToDeliveredRate = totals.delivered ? totals.uniqueClicks / totals.delivered : 0;
      totals.clickToOpenRate = totals.uniqueOpens ? totals.uniqueClicks / totals.uniqueOpens : 0;
      return totals;
    },
    category: (deployment, _, { loaders }) => loaders.emailCategory.load(deployment.categoryId),
  },

  /**
   *
   */
  EmailDeploymentConnection: paginationResolvers.connection,

  EmailDeploymentReportWeek: {
    id: ({ year, week }) => `${year}_${week + 1}`,
    number: ({ week }) => week + 1,
    starting: ({ year, week }) => moment().year(year).week(week + 1).startOf('week')
      .toDate(),
    ending: ({ year, week }) => moment().year(year).week(week + 1).endOf('week')
      .toDate(),
  },

  EmailCategoryReportDetail: {
    id: ({ id, year, week }) => `${id}_${year}_${week + 1}`,
    deployments: ({ deploymentIds }) => EmailDeployment.find({ _id: { $in: deploymentIds } }),
    deploymentCount: ({ deploymentIds }) => deploymentIds.length,
    avgSent: ({ deploymentIds, totalSent }) => parseInt(
      (totalSent || 0) / deploymentIds.length,
      10,
    ),
    avgDelivered: ({ deploymentIds, totalDelivered }) => parseInt(
      (totalDelivered || 0) / deploymentIds.length,
      10,
    ),
    avgUniqueOpens: ({ deploymentIds, totalUniqueOpens }) => parseInt(
      (totalUniqueOpens || 0) / deploymentIds.length,
      10,
    ),
    avgUniqueClicks: ({ deploymentIds, totalUniqueClicks }) => parseInt(
      (totalUniqueClicks || 0) / deploymentIds.length,
      10,
    ),
  },

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
      const record = await EmailDeployment.findById(id);
      if (!record) throw new Error(`No email deployment record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allEmailDeployments: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(EmailDeployment, { pagination, sort });
    },

    /**
     *
     */
    searchEmailDeployments: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
      return instance.paginate(EmailDeployment, pagination);
    },

    emailDeploymentReport: async (_, { input }, { auth }) => {
      auth.check();

      const { start, end } = input;
      return emailDeploymentReportService.create({ start, end });
    },
  },
};
