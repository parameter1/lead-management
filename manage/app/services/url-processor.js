import Service, { inject } from '@ember/service';

import extractUrlsFromHtml from 'leads-manage/gql/queries/extract-urls';
import crawlUrl from 'leads-manage/gql/queries/crawl-url';
import generateTrackedHtml from 'leads-manage/gql/queries/generate-tracked-html';

export default Service.extend({
  /**
   *
   */
  apollo: inject(),

  /**
   *
   * @param {*} url
   * @param {*} cache
   */
  crawl(url, cache = true) {
    const variables = { url, cache };
    const resultKey = 'crawlUrl';
    return this.get('apollo').watchQuery({ query: crawlUrl, variables, fetchPolicy: 'network-only' }, resultKey);
  },

  /**
   * Extracts URLs from the provided HTML.
   *
   * @param {string} html
   * @return {Promise}
   */
  extractFrom(html) {
    const variables = { html };
    const resultKey = 'extractUrlsFromHtml';
    return this.get('apollo').watchQuery({ query: extractUrlsFromHtml, variables, fetchPolicy: 'network-only' }, resultKey);
  },

  /**
   * Generates the tracked HTML.
   *
   * @param {string} html
   * @return {Promise}
   */
  generateTrackedHtml(html) {
    const variables = { html };
    const resultKey = 'generateTrackedHtml';
    return this.get('apollo').query({ query: generateTrackedHtml, variables, fetchPolicy: 'network-only' }, resultKey);
  },
});
