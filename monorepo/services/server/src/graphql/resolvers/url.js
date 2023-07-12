const { get, getAsArray, getAsObject } = require('@parameter1/utils');
const { Pagination, TypeAhead, paginationResolvers } = require('../pagination');
const UrlManager = require('../../services/url-manager');
const LinkInjector = require('../../services/html-link-injector');
const {
  ExtractedHost,
  ExtractedUrl,
  OmedaEmailDeployment,
  Customer,
  Tag,
  TrackedHtml,
} = require('../../mongodb/models');

const { isArray } = Array;

module.exports = {
  /**
   *
   */
  ExtractedUrlConnection: paginationResolvers.connection,

  /**
   *
   */
  ExtractedHost: {
    /**
     *
     */
    customer: (host) => {
      if (!host.customerId) return null;
      return Customer.findOne({ _id: host.customerId || null, deleted: false });
    },
    /**
     *
     */
    tags: (host) => {
      if (!isArray(host.tagIds) || !host.tagIds.length) return [];
      return Tag.find({ _id: { $in: host.tagIds }, deleted: false });
    },
  },

  ExtractedUrl: {
    /**
     *
     */
    host: (url, _, { loaders }) => loaders.extractedHost.load(url.resolvedHostId),
    /**
     *
     */
    customer: (url) => {
      if (!url.customerId) return null;
      return Customer.findOne({ _id: url.customerId || null, deleted: false });
    },
    /**
     *
     */
    tags: (url) => {
      if (!isArray(url.tagIds) || !url.tagIds.length) return [];
      return Tag.find({ _id: { $in: url.tagIds }, deleted: false });
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    extractedHost: async (root, { id }, { auth }) => {
      auth.check();
      const host = await ExtractedHost.findById(id);
      if (!host) throw new Error(`No host found for ID '${id}'`);
      return host;
    },

    /**
     *
     */
    extractedUrl: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const host = await ExtractedUrl.findById(id);
      if (!host) throw new Error(`No URL found for ID '${id}'`);
      return host;
    },

    /**
     *
     */
    extractUrlsFromHtml: (root, { html }, { auth }) => {
      auth.checkAdmin();
      return LinkInjector.extractUrlsFrom(html);
    },

    /**
     *
     */
    generateTrackedHtml: async (root, { html }, { auth, tenant }) => {
      auth.checkAdmin();
      const { original, replaced } = await LinkInjector.injectInto(html, tenant);
      await TrackedHtml.create({
        date: new Date(),
        userId: auth.user._id,
        original,
        processed: replaced,
      });
      return replaced;
    },

    /**
     * @todo Pass the requesting user agent and headers to the URL crawler.
     */
    crawlUrl: (root, { url, cache }, { auth, tenant }) => {
      auth.checkAdmin();
      const name = get(tenant, 'doc.name');
      const domains = getAsArray(tenant, 'doc.internalHosts');
      const tagMap = getAsObject(tenant, 'doc.hostTagMap');
      const instance = new UrlManager(name, domains, tagMap);
      return instance.crawl(url, cache);
    },

    /**
     *
     */
    allExtractedUrls: async (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(ExtractedUrl, { pagination, sort });
    },

    /**
     *
     */
    searchExtractedUrls: async (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
      return instance.paginate(ExtractedUrl, pagination);
    },

    /**
     *
     */
    allExtractedUrlsForDeployment: async (_, { deploymentId, pagination, sort }, { auth }) => {
      auth.check();
      const deployment = await OmedaEmailDeployment.findById(deploymentId);
      const criteria = { _id: { $in: deployment.urlIds } };
      return new Pagination(ExtractedUrl, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchExtractedUrlsForDeployment: async (_, {
      deploymentId,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const deployment = await OmedaEmailDeployment.findById(deploymentId);
      const criteria = { _id: { $in: deployment.urlIds } };
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(ExtractedUrl, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    extractedUrlCustomer: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { urlId, customerId } = input;
      const url = await ExtractedUrl.findById(urlId);
      if (!url) throw new Error(`No url found for ID '${urlId}'`);
      url.customerId = customerId || undefined;
      await url.save();
      return url;
    },

    extractedUrlLinkType: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { urlId, type } = input;
      const url = await ExtractedUrl.findById(urlId);
      if (!url) throw new Error(`No url found for ID '${urlId}'`);
      url.linkType = type;
      await url.save();
      return url;
    },

    extractedHostCustomer: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { hostId, customerId } = input;
      const host = await ExtractedHost.findById(hostId);
      if (!host) throw new Error(`No host found for ID '${hostId}'`);
      host.customerId = customerId || undefined;
      await host.save();
      return host;
    },

    extractedUrlTags: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { urlId, tagIds } = input;
      const url = await ExtractedUrl.findById(urlId);
      if (!url) throw new Error(`No url found for ID '${urlId}'`);
      if (!tagIds.length) {
        url.tagIds = [];
      } else {
        url.tagIds = tagIds;
      }
      await url.save();
      return url;
    },

    extractedHostTags: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { hostId, tagIds } = input;
      const host = await ExtractedHost.findById(hostId);
      if (!host) throw new Error(`No host found for ID '${hostId}'`);
      if (!tagIds.length) {
        host.tagIds = [];
      } else {
        host.tagIds = tagIds;
      }
      await host.save();
      return host;
    },

    extractedUrlParams: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { urlId, params } = input;
      const url = await ExtractedUrl.findById(urlId);
      if (!url) throw new Error(`No url found for ID '${urlId}'`);
      url.urlParams = params;
      await url.save();
      return url;
    },

    extractedHostParams: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { hostId, params } = input;
      const host = await ExtractedHost.findById(hostId);
      if (!host) throw new Error(`No host found for ID '${hostId}'`);
      host.urlParams = params;
      await host.save();
      return host;
    },
  },
};
