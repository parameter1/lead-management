const Juicer = require('url-juicer');
const { URL, URLSearchParams } = require('url');
const promiseRetry = require('promise-retry');
const env = require('../env');
const ExtractedHost = require('../models/extracted-host');
const ExtractedUrl = require('../models/extracted-url');
const Customer = require('../models/customer');
const checkDupe = require('../utils/check-dupe-key');
const nameSlug = require('../utils/name-slug');
const createHash = require('../utils/create-hash');

const { TENANT_KEY } = env;
const { isArray } = Array;
const { assign } = Object;
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
   * @todo Tracking rules are not yet applied to this version.
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
    let htmlBody = '';
    try {
      await this.refreshGoogleAd(originalUrl);
      const response = await crawl(originalUrl);

      extractedUrl.title = response.title;
      extractedUrl.meta = response.meta;
      extractedUrl.errorMessage = undefined;
      htmlBody = response.body;

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
    await this.applyTrackingRules(extractedUrl, htmlBody);
    return extractedUrl.save();
  },

  applyHostTrackingRules(extractedHost) {
    const { value } = extractedHost;
    if (/www\.ien\.com/i.test(value)
      || /www\.designdevelopmenttoday\.com/i.test(value)
      || /www\.foodmanufacturing\.com/i.test(value)
      || /www\.mbtmag\.com/i.test(value)
      || /www\.impomag\.com/i.test(value)
      || /www\.inddist\.com/i.test(value)
      || /www\.manufacturing\.net/i.test(value)
    ) {
      extractedHost.urlParams.push({ key: 'lt.usr', value: '%%subscriberid%%' });
      extractedHost.urlParams.push({ key: 'utm_source', value: '%%emailname_%%' });
      extractedHost.urlParams.push({ key: 'utm_medium', value: 'email' });
      extractedHost.urlParams.push({ key: 'utm_campaign', value: '%%_emailid%%' });
      extractedHost.urlParams.push({ key: 'utm_term', value: '%%jobid%%' });
    } else {
      extractedHost.urlParams.push({ key: 'utm_source', value: 'Industrial Media' });
      extractedHost.urlParams.push({ key: 'utm_medium', value: 'email' });
      extractedHost.urlParams.push({ key: 'utm_campaign', value: '%%emailname_%%' });
      extractedHost.urlParams.push({ key: 'utm_term', value: '%%_emailid%%' });
    }
    return extractedHost;
  },

  /**
   * @todo These are hardcoded for now. Eventually create an interface.
   * @param {ExtractedUrl} extractedUrl
   * @param {body} body The crawled HTML body of the URL, if applicable.
   */
  async applyTrackingRules(extractedUrl, body) {
    const parsed = new URL(extractedUrl.values.original);
    const { hostname, pathname } = parsed;

    if (TENANT_KEY === 'ien') {
      if (/www\.ien\.com/i.test(hostname)
        || /www\.foodmanufacturing\.com/i.test(hostname)
        || /www\.mbtmag\.com/i.test(hostname)
        || /www\.impomag\.com/i.test(hostname)
        || /www\.inddist\.com/i.test(hostname)
        || /www\.manufacturing\.net/i.test(hostname)
        || /www\.designdevelopmenttoday\.com/i.test(hostname)
      ) {
        // Tag ien.com (and related) hosts with Website Content.
        extractedUrl.tagIds.push('59f0ed5d058a3b0a782f0fd6');
        // Set link type to editorial
        extractedUrl.set('linkType', 'Editorial');
        if (/\/video\//i.test(pathname)) {
          // Tag ien.com videos with Video.
          extractedUrl.tagIds.push('5a708817058a3b902a5b7ca0');
        }
        if (/\/product\//i.test(pathname)) {
          // Tag ien.com videos with PR.
          extractedUrl.tagIds.push('59355b49058a3b653a3c86be');
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
      if (/ien\.wufoo\.com/i.test(hostname)) {
        // Tag ien.wufoo.com hosts with CPL Form.
        extractedUrl.tagIds.push('5ddbdadc667743007e3fa9f2');
      }
    } else if (TENANT_KEY === 'ddt') {
      if (/www\.designdevelopmenttoday\.com/i.test(hostname)) {
        // Tag ien.com hosts with Website Content.
        extractedUrl.tagIds.push('5b718aca07bb8d0019e40292');
        // Set link type to editorial
        extractedUrl.set('linkType', 'Editorial');
        if (/\/video\//i.test(pathname)) {
          // Tag ien.com videos with Video.
          extractedUrl.tagIds.push('5b718ab507bb8d0019e40291');
        }
        if (/\/product\//i.test(pathname)) {
          // Tag ien.com videos with PR.
          extractedUrl.tagIds.push('5b718aad07bb8d0019e40290');
          if (body) {
            const $ = Juicer.extractor.cheerio(body);
            const element = $('[data-bvo-template-name="platform-content.company-name"] .value');
            // Attempt to extract customer.
            if (element) {
              const companyName = element.text().trim();
              if (companyName) {
                const companyNameKey = nameSlug(companyName);
                const cus = await Customer.findOneAndUpdate({ key: companyNameKey }, {
                  $setOnInsert: {
                    deleted: false,
                    name: companyName,
                    key: companyNameKey,
                    hash: createHash(`${Date.now()}`),
                  },
                }, { upsert: true, new: true });
                extractedUrl.set('customerId', cus.id);
              }
            }
          }
        }
      }
      if (/ien\.wufoo\.com/i.test(hostname)) {
        // Tag ien.wufoo.com hosts with CPL Form.
        extractedUrl.tagIds.push('5ddbdb096059d03c8485c5df');
      }
    }
  },

  async refreshGoogleAd(originalUrl) {
    const pattern = new RegExp('pubads.g.doubleclick.net/gampad/jump', 'i');
    const isGoogleAd = pattern.test(originalUrl);
    if (isGoogleAd) {
      const beacon = originalUrl.replace(pattern, 'pubads.g.doubleclick.net/gampad/ad');
      await crawl(beacon);
    }
  },

  parseVarsFromMergeParam(mv) {
    if (!mv) return {};
    try {
      const decoded = decodeURIComponent(mv);
      return decoded.split('&')
        .map((pair) => pair.split('='))
        .map((values) => ({ key: values[0].replace(/~~/g, '%%'), value: values[1] || '' }))
        .filter((kv) => kv.key && kv.key.length)
        .reduce((vars, kv) => {
          assign(vars, { [kv.key]: kv.value });
          return vars;
        }, {});
    } catch (e) {
      return {};
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
   * Returns an object of filled url params from merge variables.
   * The object keys are the param keys, whose values are either discrete from the db, or filled.
   * Will exclude merge var params that are missing from the `mv` value.
   *
   * @param {ExtractedUrl} extractedUrl The ExtractedUrl document.
   * @param {string} mv The URL decoded `mv` query string parameter.
   */
  async getFilledParamsFor(extractedUrl, mv) {
    // Get any URL parameters specifically set on the extract host and URL.
    const urlParams = await this.getMergedUrlParams(extractedUrl);
    // Parse the `mv` value from the tracked query string.
    const mergeVars = this.parseVarsFromMergeParam(mv);
    return this.getFilledUrlParams(urlParams, mergeVars);
  },

  /**
   *
   * @param {array} urlParams An array of param objects, consisting of
   * key, value, and isMergeVar props.
   * `[{ key: 'email', value: 'foo@bar' }, { key: 'dill', value: '%%var1%%', isMergeVar: true }],`
   *
   * @param {object} mergeVars  An object of merge vars, whose keys are
   * the original merge var values.
   * `{ '%%var1%%': 'foo', '%%var2%%': 'bar' }`
   */
  getFilledUrlParams(urlParams, mergeVars) {
    if (!isArray(urlParams) || !urlParams.length) return {};
    const vars = typeof mergeVars === 'object' ? mergeVars : {};
    return urlParams.map((param) => {
      const { key, value, isMergeVar } = param;
      if (isMergeVar) return { key, value: vars[value] };
      return { key, value };
    }).filter(({ value }) => value).reduce((obj, param) => {
      const { key, value } = param;
      return { ...obj, [key]: value };
    }, {});
  },

  async upsertExtractedUrl(url) {
    if (!url) throw new Error('Unable to extract URL: no URL was provided.');

    const trimmed = String(url).trim();
    const parsed = Juicer.url.parse(trimmed);

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
   * @return {object[]} An array of objects containing `key` and `value` properties.
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
