const jwt = require('jsonwebtoken');
const escapeRegex = require('escape-string-regexp');
const { URL, URLSearchParams } = require('url');
const ExtractedUrl = require('../mongodb/models/extracted-url');
const UrlManager = require('./url-manager');
const cleanUrl = require('../utils/clean-url');
const isURL = require('../utils/is-url');

const matchPattern = new RegExp('(<a[^>]+href=[\'"])(\\s{0,}http.*?)(["\'][^>]*>.*?</a>)', 'igs');

module.exports = {
  /**
   *
   * @param {string} html
   */
  async injectInto(html) {
    const original = html || '';
    if (!original) return { original, replaced: original };
    const cleanedHtml = await this.replaceDoubleTrackedUrls(original);

    const raw = this.rawExtract(cleanedHtml);
    if (!raw.length) return { original, replaced: original };

    const mapped = this.rawCleanMap(raw);
    const clean = this.getCleanUrlsFrom(mapped);
    if (!clean.length) return { original, replaced: original };

    const urls = await ExtractedUrl.find({ 'values.original': { $in: clean } });
    if (!urls.length) return { original, replaced: original };

    const tracked = await this.createDirectlyTrackedUrls(urls);

    const replacements = this.replacementMap(mapped, tracked);
    const replaced = this.replaceUrls(cleanedHtml, replacements);
    return { original, replaced };
  },

  /**
   * Creates an array of directly-tracked (non-redirected) URLs.
   *
   * @private
   * @param {ExtractedUrl[]} urls
   */
  createDirectlyTrackedUrls(urls, ack) {
    return Promise.all(urls.filter((url) => !url.trackingDisabled).map(async (url) => {
      const { original } = url.values;
      const redirect = await this.createDirectlyTrackedUrl(url, ack);
      return { original, redirect };
    }));
  },

  /**
   * Creates a tracked, non-redirect URL for the provided ExtractedUrl.
   *
   * @private
   * @param {ExtractedUrl} url
   */
  async createDirectlyTrackedUrl(url) {
    const { id } = url;
    const { original } = url.values;
    const parsed = new URL(original);
    const params = new URLSearchParams(parsed.searchParams);

    // Inject the link ID on all URLs.
    params.set('__lt-lid', id);

    // Get parameters to inject.
    const injectParams = await UrlManager.getMergedUrlParams(url);
    if (injectParams && injectParams.length) {
      // Process parameter values.
      if (/wufoo\.com\/forms/i.test(original)) {
        // Wufoo form.
        const { pathname } = parsed;
        const cleaned = pathname.replace(/\/+$/, '').replace(/\/def$/, '');
        const wufooParams = injectParams.reduce((p, { key, value }) => {
          p.set(key, value);
          return p;
        }, new URLSearchParams());
        parsed.pathname = `${cleaned}/def/${wufooParams}`;
      } else {
        // Regular link.
        injectParams.forEach(({ key, value }) => {
          const current = params.get(key);
          // Do not overwrite a key if it's already set on the URL.
          if (!current) params.set(key, value);
        });
      }
    }

    // Set the new search params on the URL.
    parsed.search = params;
    // Stringify the new URL.
    const modified = `${parsed}`;

    // Convert merge vars.
    const regex = /%40%7B(.*?)%7D%40/g;
    let matches;
    let replaced = modified;
    // eslint-disable-next-line no-cond-assign
    while (matches = regex.exec(modified)) {
      const search = matches[0];
      const replace = `@{${matches[1].replace(/\+/g, ' ')}}@`;
      replaced = replaced.replace(search, replace);
    }
    return replaced;
  },

  async replaceDoubleTrackedUrls(html) {
    if (!html) return '';

    const raw = this.rawExtract(html);
    if (!raw.length) return html;

    const mapped = await this.doubleTrackedMap(raw);
    const clean = this.getCleanUrlsFrom(mapped);
    if (!clean.length) return html;

    const urls = await ExtractedUrl.find({ 'values.original': { $in: clean } });
    if (!urls.length) return html;

    const restored = urls.map((url) => {
      const { original } = url.values;
      return { original, redirect: original };
    });

    const replacements = this.replacementMap(mapped, restored);
    const replaced = this.replaceUrls(html, replacements);
    return replaced;
  },

  /**
   * Returns a clean, unique set of URLs found in the HTML.
   * By clean, we mean trimmed, decoded and normalized via URL parsing.
   *
   * @param {string} html
   */
  async extractUrlsFrom(html) {
    // Clean double-tracked URLs!
    const cleanedHtml = await this.replaceDoubleTrackedUrls(html);
    const raw = this.rawExtract(cleanedHtml);
    const mapped = this.rawCleanMap(raw);
    const hrefs = this.getCleanUrlsFrom(mapped);
    return hrefs;
  },

  replaceUrls(html, replacements) {
    let replaced = String(html);
    replacements.forEach((replacement) => {
      const { search, value } = replacement;
      const regex = new RegExp(`(<a[^>]+href=['"])(${escapeRegex(search)})(["'][^>]*>.*?</a>)`, 'igs');
      replaced = replaced.replace(regex, `$1${value}$3`);
    });
    return replaced;
  },

  /**
   * Creates a map of raw/original URLs to be replaced.
   *
   * @private
   * @param {array} mapped
   * @param {array} tracked
   */
  replacementMap(mapped, tracked) {
    const replacements = [];
    mapped.forEach((map) => {
      const found = tracked.find((t) => t.original === map.clean);
      if (found) replacements.push({ search: map.raw, value: found.redirect });
    });
    return replacements;
  },

  /**
   * Returns a raw, unique set of URLs found in the HTML.
   * By raw, we mean untrimmed, undecoded, and  unnormalized.
   * It will discard outright invalid URLs that do not start
   * with http|https, are empty, or are bad, such as https://
   *
   * For example `<a href="  http://www.google.com?foo=bar&amp;x=y "></a>`
   * will be returned as '  http://www.google.com?foo=bar&amp;x=y '
   *
   * @private
   * @param {string} html
   */
  rawExtract(html) {
    const hrefs = [];
    let match;
    do {
      match = matchPattern.exec(html);
      if (match) {
        // The URL validator will fail if any spaces, <, or > characters are found.
        // As such, temporarily replace these with url encoded items.
        const temp = match[2]
          .trim()
          .replace(/\s/g, '%20')
          .replace(/</g, '%3C')
          .replace(/>/g, '%3E');
        if (isURL(temp)) {
          hrefs.push(match[2]);
        }
      }
    } while (match);
    return [...new Set(hrefs)];
  },

  async doubleTrackedMap(raw) {
    const mapped = await Promise.all(raw
      .map((url) => {
        const urlId = this.extractTrackedUrlId(cleanUrl(url));
        return { url, urlId };
      })
      .filter((o) => o.urlId)
      .map(async ({ url, urlId }) => {
        const extractedUrl = await ExtractedUrl.findById(urlId, { 'values.original': 1 });
        return { url, extractedUrl };
      }));

    return mapped
      .filter((o) => o.extractedUrl)
      .map(({ url, extractedUrl }) => ({ raw: url, clean: extractedUrl.get('values.original') }));
  },

  /**
   * Creates an array map of raw-to-clean URLs.
   * By clean, we mean trimmed, decoded, and normalized via URL parsing.
   *
   * For example, if an incoming array value is
   * '  http://www.google.com?foo=bar&amp;x=y '
   * it will be mapped as:
   * {
   *  raw: '  http://www.google.com?foo=bar&amp;x=y ',
   *  clean: 'http://www.google.com?foo=bar&x=y',
   * }
   *
   * @private
   * @param {array} raw
   */
  rawCleanMap(raw) {
    return raw.map((url) => {
      const clean = cleanUrl(url);
      return { raw: url, clean };
    });
  },

  extractTrackedUrlId(clean) {
    const match1 = /:\/\/leads\.ien\.com\/api\/c\/([a-f0-9]{24})/i.exec(clean);
    if (match1 && match1[1]) return match1[1];

    const match2 = /:\/\/leads\.limit0\.io\/click\/([a-f0-9]{24})/i.exec(clean);
    if (match2 && match2[1]) return match2[1];

    const match3 = /t=([a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+))/i.exec(clean);
    if (match3 && match3[1]) {
      try {
        const decoded = jwt.decode(match3[1], { complete: true, force: true });
        return decoded.payload.url || null;
      } catch (e) {
        return null;
      }
    }
    const match4 = /lt\.lid=([a-f0-9]{24})/i.exec(clean);
    if (match4 && match4[1]) return match4[1];

    const match5 = /__lt-lid=([a-f0-9]{24})/i.exec(clean);
    if (match5 && match5[1]) return match5[1];

    const match6 = /%3C\.lid=([a-f0-9]{24})/i.exec(clean);
    if (match6 && match6[1]) return match6[1];

    const match7 = /&lt;\.lid=([a-f0-9]{24})/i.exec(clean);
    if (match7 && match7[1]) return match7[1];

    const match8 = /<\.lid=([a-f0-9]{24})/i.exec(clean);
    if (match8 && match8[1]) return match8[1];
    return null;
  },

  /**
   * Returns a cleaned, unique set of URLs from a raw-to-clean array map.
   * If the URL is invalid, it won't be included in the final array.
   *
   * @private
   * @param {array} rawCleanMap
   */
  getCleanUrlsFrom(rawCleanMap) {
    const hrefs = rawCleanMap.map((url) => url.clean);
    return [...new Set(hrefs)];
  },
};
