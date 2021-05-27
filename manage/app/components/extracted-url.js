import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'div',
  classNames: ['card', 'my-4', 'list-index'],

  /**
   * Services.
   */
  notify: inject(),
  urlProcessor: inject(),
  graphErrors: inject(),

  /**
   * Public properties.
   */
  url: null,

  /**
   * Private properties.
   */
  isLoading: true,
  errorMessage: null,

  /**
   * Computed properties.
   */
  didError: computed('errorMessage.length', function() {
    return this.get('errorMessage.length') ? true : false;
  }),

  init() {
    this._super(...arguments);
    this.set('model', {});
    this.send('crawl');
  },

  actions: {
    crawl(cache = true) {
      this.set('isLoading', true);
      this.get('urlProcessor').crawl(this.get('url'), cache)
        .then(extractedUrl => this.set('model', extractedUrl))
        .catch(e => this.set('errorMessage', this.get('graphErrors').handle(e).message))
        .finally(() => this.set('isLoading', false))
      ;
    },
  },
});
