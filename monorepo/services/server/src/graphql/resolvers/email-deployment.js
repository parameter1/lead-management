const upsertDeployments = require('@lead-management/sync/commands/upsert-deployments');
const {
  EXPOSED_PORT,
  HOST,
  HOST_NAME,
  isDevelopment,
} = require('../../env');
const { Pagination, TypeAhead, paginationResolvers } = require('../pagination');
const { OmedaEmailDeployment, OmedaDeploymentType } = require('../../mongodb/models');
const emailDeploymentReportService = require('../../services/email-deployment-report');
const dayjs = require('../../dayjs');

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
      OmedaEmailDeployment.metricMap().forEach((omedaKey, ourKey) => {
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
    url: (dep) => {
      const uri = isDevelopment ? `http://${HOST}:${EXPOSED_PORT}` : `https://${HOST_NAME}`;
      return `${uri}/email-deployment-html/${dep.entity}`;
    },
  },

  /**
   *
   */
  EmailDeploymentType: {
    omedaId: (doc) => doc.get('data.Id'),
    name: (doc) => doc.get('data.Name'),
    description: (doc) => doc.get('data.Description'),
    statusCode: (doc) => doc.get('data.StatusCode'),
  },

  /**
   *
   */
  EmailDeploymentReportWeek: {
    id: ({ year, week }) => `${year}_${week}`,
    number: ({ week }) => week,
    starting: ({ year, week }) => dayjs().year(year).week(week).startOf('week')
      .toDate(),
    ending: ({ year, week }) => dayjs().year(year).week(week).endOf('week')
      .toDate(),
  },

  /**
   *
   */
  EmailDeploymentTypeReportDetail: {
    id: ({ name, year, week }) => `${name}_${year}_${week}`,
    deployments: ({ deploymentIds }) => OmedaEmailDeployment.find({ _id: { $in: deploymentIds } }),
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
  EmailDeploymentTypeConnection: paginationResolvers.connection,

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
    emailDeploymentReport: (_, { input }, { auth }) => {
      auth.check();
      const { start, end } = input;
      return emailDeploymentReportService.create({ start, end });
    },

    /**
     *
     */
    allEmailDeployments: (_, args, { auth }) => {
      auth.check();
      const {
        pagination,
        sort,
        urlIds,
      } = args;
      const criteria = {
        ...(urlIds.length && { urlIds: { $in: urlIds } }),
      };
      return new Pagination(OmedaEmailDeployment, { criteria, pagination, sort });
    },

    /**
     *
     */
    searchEmailDeployments: (_, args, { auth }) => {
      auth.check();
      const {
        pagination,
        search,
        options,
        urlIds,
      } = args;
      const criteria = {
        ...(urlIds.length && { urlIds: { $in: urlIds } }),
      };
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(OmedaEmailDeployment, pagination);
    },

    /**
     *
     */
    searchEmailDeploymentTypes: (_, args, { auth }) => {
      auth.check();
      const {
        pagination,
        search,
        options,
      } = args;
      const { field, phrase } = search;
      const criteria = { 'data.StatusCode': 1 };
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(OmedaDeploymentType, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    refreshEmailDeployment: async (_, { input }, { auth, tenant }) => {
      auth.check();
      const { id } = input;
      const record = await OmedaEmailDeployment.findById(id);
      if (!record) throw new Error(`No email deployment record found for ID ${id}.`);
      await upsertDeployments({ tenantKey: tenant.key, trackIds: [record.get('omeda.TrackId')] });
      return OmedaEmailDeployment.findById(id);
    },
  },
};
