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

  _runAuthorize(request, context) {
    const headers = {};
    const { ohBehaveToken } = context;
    if (ohBehaveToken) {
      headers['X-Behavior-Token'] = ohBehaveToken;
    }
    if (!this.get('session.isAuthenticated')) {
      return { headers };
    }
    return new Promise((resolve) => {
      const data = this.get('session.data.authenticated.session');
      headers['Authorization'] = `Bearer ${get(data, 'token')}`;
      resolve({ headers })
    });
  }
});
