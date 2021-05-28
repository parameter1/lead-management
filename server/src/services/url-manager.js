const Juicer = require('url-juicer');
const { URL, URLSearchParams } = require('url');
const promiseRetry = require('promise-retry');
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

const crawl = (url) => Juicer.crawler.crawl(url, {
  jar: true,
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  },
});

module.exports = {
  /**
   *
   * @param {string} url
   * @param {booleam} [cache=true]
   */
  async crawl(url, cache = true) {
    const extractedUrl = await promiseRetry((retry) => this.upsertExtractedUrl(url)
      .catch((err) => checkDupe(retry, err)), retryOpts);

    if (!extractedUrl.errorMessage && extractedUrl.lastCrawledDate && cache) {
      return extractedUrl;
    }

    const originalUrl = extractedUrl.values.original;
    try {
      const response = await crawl(originalUrl);

      extractedUrl.title = response.title;
      extractedUrl.meta = response.meta;
      extractedUrl.errorMessage = undefined;

      if (response.url.redirected) {
        extractedUrl.set('values.resolved', response.url.resolved);
        const host = await promiseRetry((retry) => this.upsertExtractedHost(response.host)
          .catch((err) => checkDupe(retry, err)), retryOpts);
        extractedUrl.resolvedHostId = host.id;
      }
    } catch (e) {
      const { response } = e;
      if (response) {
        const { statusCode, statusMessage } = response;
        extractedUrl.errorMessage = `${statusMessage} (${statusCode})`;
      } else {
        extractedUrl.errorMessage = e.message;
      }
    }
    extractedUrl.lastCrawledDate = new Date();
    await this.applyTrackingRules(extractedUrl);
    return extractedUrl.save();
  },

  /**
   *
   * @param {object} object
   * @returns {object}
   */
  applyHostTrackingRules(extractedHost) {
    const { value } = extractedHost;

    const map = extractedHost.urlParams.reduce((m, { key, value: v }) => {
      map.set(key, v);
      return map;
    }, new Map());

    if (/www\.ien\.com/i.test(value)
      || /www\.designdevelopmenttoday\.com/i.test(value)
      || /www\.foodmanufacturing\.com/i.test(value)
      || /www\.mbtmag\.com/i.test(value)
      || /www\.impomag\.com/i.test(value)
      || /www\.inddist\.com/i.test(value)
      || /www\.manufacturing\.net/i.test(value)
    ) {
      map.set('lt.usr', '@{encrypted_customer_id}@');
      map.set('utm_source', '@{track_id}@');
      map.set('utm_medium', 'email');
      map.set('utm_campaign', '@{mv_date_MMddyyyy}@');
      map.set('utm_term', '@{track_id}@');
    } else {
      map.set('utm_source', 'Industrial Media');
      map.set('utm_medium', 'email');
      map.set('utm_campaign', '@{mv_date_MMddyyyy}@');
      map.set('utm_term', '@{track_id}@');
    }
    const newParams = [];
    map.forEach((key, v) => newParams.push({ key, value: v }));
    extractedHost.set('urlParams', newParams);
    return extractedHost;
  },

  /**
   *
   * @todo These are hardcoded for now. Eventually create an interface.
   * @param {ExtractedUrl} extractedUrl
   * @param {body} body The crawled HTML body of the URL, if applicable.
   */
  async applyTrackingRules(extractedUrl) {
    const parsed = new URL(extractedUrl.values.original);
    const { hostname, pathname } = parsed;

    const tags = await Tag.find({ name: { $in: ['Website Content', 'Video', 'PR', 'CPL Form'] } });
    const tagMap = tags.reduce((m, tag) => {
      m.set(tag.name, tag.id);
      return m;
    }, new Map());

    if (/www\.ien\.com/i.test(hostname)
      || /www\.foodmanufacturing\.com/i.test(hostname)
      || /www\.mbtmag\.com/i.test(hostname)
      || /www\.impomag\.com/i.test(hostname)
      || /www\.inddist\.com/i.test(hostname)
      || /www\.manufacturing\.net/i.test(hostname)
      || /www\.designdevelopmenttoday\.com/i.test(hostname)
    ) {
      // Tag ien.com (and related) hosts with Website Content.
      if (tagMap.has('Website Content')) extractedUrl.tagIds.push(tagMap.get('Website Content'));
      // Set link type to editorial
      extractedUrl.set('linkType', 'Editorial');
      if (/\/video\//i.test(pathname) && tagMap.has('Video')) {
        // Tag ien.com videos with Video.
        extractedUrl.tagIds.push(tagMap.get('Video'));
      }
      if (/\/product\//i.test(pathname) && tagMap.has('PR')) {
        // Tag ien.com products with PR.
        extractedUrl.tagIds.push(tagMap.get('PR'));
        const { title } = extractedUrl;
        if (title) {
          // Attempt to extract customer.
          // @todo need to account for different formats of this.
          // @todo or add a meta tag
          const matches = /From:\s(.*?)\s\|/.exec(title);
          if (matches && matches[1]) {
            const key = nameSlug(matches[1]);
            const customer = await Customer.findOneAndUpdate({ key }, {
              $setOnInsert: {
                deleted: false,
                name: matches[1],
                key,
                hash: createHash(`${Date.now()}`),
              },
            }, { upsert: true, new: true });
            extractedUrl.set('customerId', customer.id);
          }
        }
      }
    }
    if (tagMap.has('CPL Form') && (/ien\.wufoo\.com/i.test(hostname) || /ien\.formstack\.com/i.test(hostname))) {
      // Tag ien.wufoo.com and ien.formstack.com hosts with CPL Form.
      extractedUrl.tagIds.push(tagMap.get('CPL Form'));
    }
  },

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
  },

  injectWufooParams(url, params) {
    const cleaned = url.replace(/\/+$/, '').replace(/\/def$/, '');
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      searchParams.set(key, value);
    });
    return `${cleaned}/def/${searchParams}`;
  },

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
  },

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
    const update = { $setOnInsert };
    if (host.urlParams.length) {
      update.$addToSet = {
        urlParams: { $each: host.urlParams },
      };
    }

    const options = { new: true, upsert: true };
    return ExtractedHost.findOneAndUpdate({ value: host.value }, update, options);
  },

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
  },

  /**
   *
   * @param {array} hostParams
   * @param {array} urlParams
   * @returns {object[]} An array of objects containing `key` and `value` properties.
   */
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
  },
};
