import Component from '@ember/component';

export default Component.extend({

  /**
   * The Apollo client query observable.
   * @type {Observable}
   */
  query: null,

  hasNextPage: false,
  nextOffset: null,

  resultKey: null,

  isFetching: false,

  hasEvent(name) {
    const fn = this.get(name);
    return fn && typeof fn === 'function';
  },

  sendEvent(name, ...args) {
    if (this.hasEvent(name)) this.get(name)(...args, this);
  },

  actions: {
    /**
     * Fetches more results using the observable from the original query.
     * @see https://www.apollographql.com/docs/react/features/pagination.html
     */
    async fetchMore() {
      this.set('isFetching', true);
      this.sendEvent('on-fetch-start');
      const observable = this.get('query');
      const nextOffset = this.get('nextOffset');
      const resultKey = this.get('resultKey');

      const updateQuery = (previous, { fetchMoreResult }) => {
        const { nodes, pageInfo, totalCount } = fetchMoreResult[resultKey];
        if (!nodes.length) return previous;
        return {
          [resultKey]: {
            __typename: previous[resultKey].__typename,
            totalCount,
            nodes: [...previous[resultKey].nodes, ...nodes],
            pageInfo,
          },
        };
      };
      const input = { ...observable.variables.input, offset: nextOffset }
      const variables = { input };
      try {
        const result = await observable.fetchMore({ updateQuery, variables });
        this.sendEvent('on-fetch-success', result);
        return result;
      } catch (e) {
        const evt = 'on-fetch-error';
        if (this.hasEvent(evt)) {
          this.sendEvent(evt, e);
        } else {
          throw e;
        }
      } finally {
        this.set('isFetching', false);
        this.sendEvent('on-fetch-end');
      }
    },
  },
});
