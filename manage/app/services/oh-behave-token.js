import Service, { inject } from '@ember/service';
import config from 'leads-manage/config/environment';

import behaviorCreateApiSession from 'leads-manage/gql/mutations/behavior/api-session';

const storageKey = 'oh-behave-token';

export default Service.extend({
  apollo: inject(),

  getFromStorage() {
    const value = localStorage.getItem(storageKey);
    if (!value) return null;
    return JSON.parse(value);
  },

  getPropertyId() {
    const { propertyId } = config.behaviorAPI;
    return propertyId;
  },

  async retrieve(useCache = false) {
    const fromStorage = this.getFromStorage();
    if (useCache && fromStorage) {
      return fromStorage.token;
    }
    // Load from the backend.
    const { key } = config.behaviorAPI;
    const mutation = behaviorCreateApiSession;
    const variables = { input: { key } };
    const result = await this.get('apollo').mutate({ mutation, variables }, 'behaviorCreateApiSession');
    const { session } = result;
    localStorage.setItem(storageKey, JSON.stringify(session));
    return session.token;
  },

});
