import ApolloService from 'ember-apollo-client/services/apollo';
import { inject } from '@ember/service';
import { computed, get } from '@ember/object';
import { setContext } from 'apollo-link-context';
import { IntrospectionFragmentMatcher, InMemoryCache } from 'apollo-cache-inmemory';
import introspectionQueryResultData from 'leads-manage/gql/fragment-types';

export default ApolloService.extend({
  session: inject(),

  fragmentMatcher: computed(function() {
    return new IntrospectionFragmentMatcher({
      introspectionQueryResultData
    });
  }),

  clientOptions: computed(function() {
    return {
      link: this.get('link'),
      cache: new InMemoryCache({ fragmentMatcher: this.get('fragmentMatcher') }),
    };
  }),

  link: computed(function() {
    const httpLink = this._super(...arguments);
    const authLink = setContext((request, context) => {
      return this._runAuthorize(request, context);
    });
    return authLink.concat(httpLink);
  }),

  _runAuthorize() {
    const customClickFilter = (() => {
      if (!window.location.search) return null;
      const params = new URLSearchParams(window.location.search);
      if (!params.has('customClickFilter')) return null;
      params.set('customClickFilter', true);
      return `${params}`;
    })();


    const headers = {};
    if (!this.get('session.isAuthenticated')) {
      return { headers };
    }
    return new Promise((resolve) => {
      const data = this.get('session.data.authenticated.session');
      headers['Authorization'] = `Bearer ${get(data, 'token')}`;
      if (customClickFilter) headers['x-custom-click-filter-query'] = customClickFilter;
      resolve({ headers })
    });
  }
});
