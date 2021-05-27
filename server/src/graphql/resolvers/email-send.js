const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const EmailDeployment = require('../../models/email-deployment');
const EmailSend = require('../../models/email-send');
const EmailSendUrl = require('../../models/email-send-url');
const SendProvider = require('../../services/email-send-provider');

module.exports = {
  /**
   *
   */
  EmailSend: {
    deployment: (send, _, { loaders }) => loaders.emailDeployment.load(send.deploymentId),
  },

  EmailSendMetrics: {
    deliveryRate: (metrics) => {
      const { sent, delivered } = metrics;
      if (!sent) return 0;
      return delivered / sent;
    },
    openRate: (metrics) => {
      const { delivered, uniqueOpens } = metrics;
      if (!delivered) return 0;
      return uniqueOpens / delivered;
    },
    clickToDeliveredRate: (metrics) => {
      const { delivered, uniqueClicks } = metrics;
      if (!delivered) return 0;
      return uniqueClicks / delivered;
    },
    clickToOpenRate: (metrics) => {
      const { uniqueOpens, uniqueClicks } = metrics;
      if (!uniqueOpens) return 0;
      return uniqueClicks / uniqueOpens;
    },
  },

  /**
   *
   */
  EmailSendConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    emailSend: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await EmailSend.findById(id);
      if (!record) throw new Error(`No email send record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allEmailSends: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(EmailSend, { pagination, sort });
    },

    /**
     *
     */
    searchEmailSends: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
      return instance.paginate(EmailSend, pagination);
    },

    /**
     *
     */
    allEmailSendsForUrl: async (root, { urlId, pagination, sort }, { auth }) => {
      auth.check();
      const sendIds = await EmailSendUrl.distinct('sendId', { urlId });
      const criteria = { _id: { $in: sendIds } };
      return new Pagination(EmailSend, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchEmailSendsForUrl: async (root, {
      urlId,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const sendIds = await EmailSendUrl.distinct('sendId', { urlId });
      const criteria = { _id: { $in: sendIds } };
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(EmailSend, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    refreshEmailSend: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      const record = await EmailSend.findById(id, { deploymentId: 1, externalSource: 1 });
      if (!record) throw new Error(`No email send record found for ID ${id}.`);

      const deployment = await EmailDeployment.findById(record.deploymentId);
      if (!deployment) throw new Error(`No email deployment record found for ID ${record.deploymentId}.`);

      const jobId = record.externalSource.identifier;
      await SendProvider.upsertSendFor(jobId, deployment);
      return EmailSend.findById(id);
    },
  },
};
