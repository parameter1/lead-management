const esr = require('escape-string-regexp');
const Juicer = require('url-juicer');
const { URL, URLSearchParams } = require('url');
const promiseRetry = require('promise-retry');
const { camelize, underscore } = require('inflected');
const path = require('path');
const {
  Customer,
  ExtractedHost,
  ExtractedUrl,
  Tag,
} = require('../mongodb/models');
const checkDupe = require('../utils/check-dupe-key');
const nameSlug = require('../utils/name-slug');
const createHash = require('../utils/create-hash');

const { isArray } = Array;
const retryOpts = { retries: 1, minTimeout: 25, maxTimeout: 50 };

const doNotScrape = ['.pdf'].reduce((map, ext) => {
  map.set(ext, true);
  return map;
}, new Map());

const crawl = (url) => Juicer.crawler.crawl(url, {
  jar: true,
  strictSSL: false, // Allow potentially invalid SSL chains to still be followed.
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  },
  timeout: 5000,
});

/**
 * Determines if the supplied value belongs to one of the supplied hosts
 *
 * @param {String} value The value to check
 * @param {String[]} hosts The domains to check against
 * @returns Boolean
 */
const matchesHosts = (value, hosts = []) => hosts
  .map((hostname) => new RegExp(esr(hostname)))
  .some((pattern) => pattern.test(value));

const headerPattern = /^x-lead-management-/;
class UrlManager {
  /**
   * @param {String[]} domains
   */
  constructor(name, domains = [], tagMap = {}) {
    this.name = name;
    this.domains = domains || [];
    this.tagMap = tagMap || {};
  }

  /**
   *
   * @param {string} url
   * @param {booleam} [cache=true]
   */
  async crawl(url, cache = true) {
    const extractedUrl = await promiseRetry((retry) => this.upsertExtractedUrl(url)
      .catch((err) => checkDupe(retry, err)), retryOpts);

    // use the url pathname for parsing the extension, not the full url
    // otherwise, query params will result in a non-matching extension... e.g. `.pdf?foo=bar`
    const parsed = new URL(extractedUrl.get('values.original'));
    const extension = path.extname(parsed.pathname);

    if (!extractedUrl.errorMessage && extractedUrl.lastCrawledDate && cache) {
      return extractedUrl;
    }

    const originalUrl = extractedUrl.values.original;
    try {
      if (!doNotScrape.has(extension)) {
        const response = await crawl(originalUrl);
        const { headers } = response.original;

        extractedUrl.title = response.title;
        extractedUrl.meta = response.meta;
        extractedUrl.errorMessage = undefined;
        extractedUrl.headerDirectives = Object.keys(headers)
          .filter((key) => headerPattern.test(key) && headers[key])
          .reduce((o, key) => {
            const v = decodeURIComponent(headers[key]).trim();
            const k = camelize(underscore(key.replace(headerPattern, '')), false);
            return { ...o, [k]: v };
          }, {});

        if (response.url.redirected) {
          extractedUrl.set('values.resolved', response.url.resolved);
          const host = await promiseRetry((retry) => this.upsertExtractedHost(response.host)
            .catch((err) => checkDupe(retry, err)), retryOpts);
          extractedUrl.resolvedHostId = host.id;
        }
      }
    } catch (e) {
      // only process additional handling when not timed out.
      if (!e.cause || !/timedout/i.test(e.cause.code)) {
        const { response } = e;
        if (response) {
          const { statusCode, statusMessage } = response;
          extractedUrl.errorMessage = `${statusMessage} (${statusCode})`;
        } else {
          extractedUrl.errorMessage = e.message;
        }
      }
    }
    // only apply tracking rules on first crawl
    // this prevents overwriting changes to the URL on subsequent crawls.
    if (!extractedUrl.lastCrawledDate) await this.applyTrackingRules(extractedUrl);
    extractedUrl.lastCrawledDate = new Date();
    return extractedUrl.save();
  }

  /**
   *
   * @param {object} object
   * @returns {object}
   */
  applyHostTrackingRules(extractedHost) {
    const { value } = extractedHost;

    const map = extractedHost.urlParams.reduce((m, { key, value: v }) => {
      m.set(key, v);
      return m;
    }, new Map());

    if (matchesHosts(value, this.domains)) {
      map.set('__lt-usr', '@{encrypted_customer_id}@');
      map.set('utm_source', '@{track_id}@');
      map.set('utm_medium', 'email');
      map.set('utm_campaign', '@{mv_date_MMddyyyy}@');
      map.set('utm_term', '@{track_id}@');
    } else {
      map.set('utm_source', this.name);
      map.set('utm_medium', 'email');
      map.set('utm_campaign', '@{mv_date_MMddyyyy}@');
      map.set('utm_term', '@{track_id}@');
    }
    const newParams = [];
    map.forEach((v, key) => newParams.push({ key, value: v }));
    extractedHost.set('urlParams', newParams);
    return extractedHost;
  }

  /**
   *
   * @todo These are hardcoded for now. Eventually create an interface.
   * @param {ExtractedUrl} extractedUrl
   * @param {body} body The crawled HTML body of the URL, if applicable.
   */
  async applyTrackingRules(extractedUrl) {
    const parsed = new URL(extractedUrl.values.original);
    const { hostname } = parsed;

    // handle auto link type
    const autoLinkType = extractedUrl.get('headerDirectives.linkType');
    if (autoLinkType) extractedUrl.set('linkType', autoLinkType);

    // handle auto tagging
    const tagSet = new Set();
    tagSet.add('CPL Form');
    const headerTags = extractedUrl.get('headerDirectives.tags');
    const toAutoTag = headerTags ? headerTags.split(',').map((v) => v.trim()).filter((v) => v) : [];
    toAutoTag.forEach((v) => tagSet.add(v));
    const tags = await Tag.find({ name: { $in: [...tagSet] } });
    const tagMap = tags.reduce((m, tag) => {
      m.set(tag.name, tag.id);
      return m;
    }, new Map());
    toAutoTag.forEach((value) => {
      const tag = tagMap.get(value);
      if (tag) extractedUrl.tagIds.addToSet(tag);
    });

    // handle auto host tagging
    Object.keys(this.tagMap).forEach((key) => {
      if (tagMap.has(key) && matchesHosts(hostname, this.tagMap[key])) {
        extractedUrl.tagIds.addToSet(tagMap.get(key));
      }
    });

    // handle auto customer tagging
    const autoCustomer = extractedUrl.get('headerDirectives.customer');
    if (autoCustomer) {
      const name = decodeURIComponent(autoCustomer).trim();
      const customerSlug = nameSlug(name);
      const customer = await Customer.findOneAndUpdate({ key: customerSlug }, {
        $setOnInsert: {
          deleted: false,
          name,
          key: customerSlug,
          hash: createHash(`${Date.now()}`),
        },
      }, { upsert: true, new: true });
      extractedUrl.set('customerId', customer.id);
    }
  }

  /**
   *
   * @param {string} url The destination URL.
   * @param {object} params The params to inject.
   */
  injectParamsIntoUrl(url, params) {
    const hasParams = typeof params === 'object' && Object.keys(params).length > 0;
    // Nothing to inject.
    if (!hasParams) return url;

    if (/wufoo\.com\/forms/i.test(url)) return this.injectWufooParams(url, params);

    const parsed = new URL(url);
    Object.keys(params).forEach((key) => {
      const value = params[key];
      const current = parsed.searchParams.get(key);
      if (!current && value) parsed.searchParams.set(key, value);
    });
    return parsed.href;
  }

  // eslint-disable-next-line class-methods-use-this
  injectWufooParams(url, params) {
    const cleaned = url.replace(/\/+$/, '').replace(/\/def$/, '');
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      searchParams.set(key, value);
    });
    return `${cleaned}/def/${searchParams}`;
  }

  /**
   *
   * @param {string} url
   */
  async upsertExtractedUrl(url) {
    if (!url) throw new Error('Unable to extract URL: no URL was provided.');

    const trimmed = `${url}`.trim();
    const parsed = new URL(trimmed);

    const host = await promiseRetry((retry) => this.upsertExtractedHost(parsed.hostname)
      .catch((err) => checkDupe(retry, err)), retryOpts);
    const extracted = new ExtractedUrl({
      resolvedHostId: host.id,
      'values.original': url,
      'values.resolved': url,
    });
    await extracted.validate();

    const criteria = { 'values.original': extracted.values.original };
    const $setOnInsert = extracted.toObject();
    const options = { new: true, upsert: true };
    return ExtractedUrl.findOneAndUpdate(criteria, { $setOnInsert }, options);
  }

  /**
   *
   * @param {string} hostname
   * @returns {object}
   */
  async upsertExtractedHost(hostname) {
    if (!hostname) throw new Error('Unable to extract host: no hostname was provided.');
    const host = new ExtractedHost({ value: hostname });
    await host.validate();
    this.applyHostTrackingRules(host);

    const $setOnInsert = { value: host.value };
    const update = { $setOnInsert, $set: { urlParams: host.urlParams } };
    const options = { new: true, upsert: true };
    return ExtractedHost.findOneAndUpdate({ value: host.value }, update, options);
  }

  /**
   *
   * @param {object} extractedUrl
   * @returns {object[]}
   */
  async getMergedUrlParams(extractedUrl) {
    const extractedHost = await ExtractedHost.findOne({ _id: extractedUrl.resolvedHostId });
    const { urlParams } = extractedUrl;
    const hostParams = extractedHost ? extractedHost.urlParams : [];

    return this.mergeUrlParams(hostParams, urlParams);
  }

  /**
   *
   * @param {array} hostParams
   * @param {array} urlParams
   * @returns {object[]} An array of objects containing `key` and `value` properties.
   */
  // eslint-disable-next-line class-methods-use-this
  mergeUrlParams(hostParams, urlParams) {
    const params = {};
    if (isArray(hostParams)) {
      hostParams.forEach((param) => {
        params[param.key] = param;
      });
    }
    if (isArray(urlParams)) {
      urlParams.forEach((param) => {
        params[param.key] = param;
      });
    }
    return Object.values(params);
  }
}

module.exports = UrlManager;
