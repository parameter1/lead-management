import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

export default Controller.extend(LoadingMixin, {
  /**
   * Determines if the processor has finished.
   */
  hasFinished: false,

  /**
   * The HTML to process.
   */
  html: null,

  /**
   * The loading service
   */
  // loading: service(),
  errorProcessor: inject('graph-errors'),

  /**
   * Determines if the pasted/entered HTML is currently being processed by the backend.
   */
  processing: false,

  /**
   * Whether to show the ignored results.
   */
  showIgnored: false,

  /**
   * The store service
   */
  // store: service(),

  /**
   * The HTML with tracked links.
   */
  trackedResult: null,

  /**
   * The backend HTML tracking error object, or null.
   */
  trackingError: null,

  /**
   * The URL processing service.
   */
  urlProcessor: inject(),

  init() {
    this._super(...arguments);
    this.set('results', []);
  },

  /**
   * Determines if the HTML is valid to process.
   */
  canProcess: computed('html.length', 'processing', function() {
    if (this.get('html.length') && !this.get('processing')) {
      return true;
    }
    return false;
  }),

  /**
   * Actions
   */
  actions: {

    /**
     * Resets/clears the link tracking state.
     */
    clear() {
      this.set('html', null);
      this._clearValuesForPreProcess();
    },

    async createTrackedHtml(useNewTracking = false) {
      this.showLoading();
      try {
        const result = await this.get('urlProcessor').generateTrackedHtml(this.get('html'), useNewTracking);
        this.set('trackedResult', result);
      } catch (e) {
        this.get('errorProcessor').show(e);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Handles pasted HTML from the form via the pase event.
     *
     * @param   {Event} event
     */
    handlePaste(event) {
      // Prevent default so pasted content does not appear twice.
      event.preventDefault();

      // Clear previously set HTML and set to clipboard contents.
      this.set('html', null);
      const html = event.originalEvent.clipboardData.getData('Text');
      this.set('html', html);

      // Begin processing.
      this.send('process');
    },

    /**
     * Processes the currently set HTML.
     */
    process() {
      if (!this.get('canProcess')) {
        return;
      }
      this.showLoading();
      this.set('processing', true);
      this._clearValuesForPreProcess();

      this.get('urlProcessor').extractFrom(this.get('html'))
        .then((urls) => {
          this.set('results', urls);
          if (!this.get('results.length')) {
            this.set('noResults', true);
          }
        })
        .catch((e) => {
          this.get('errorProcessor').show(e);
          this.set('noResults', true);
        })
        .finally(() => {
          this.set('hasFinished', true);
          this.set('processing', false);
          this.hideLoading();
        })
      ;
    },

    /**
     * Selects all text when the textarea is focused.
     * Is more visual than functional.
     */
    selectAll(event) {
      event.target.select();
    },

    /**
     * Toggles showing/hiding the ignored results.
     */
    toggleIgnored() {
      this.set('showIgnored', !this.get('showIgnored'));
    },
  },

  /**
   * Clears required value before processing.
   */
  _clearValuesForPreProcess() {
    this.get('results').clear();
    this.set('hasFinished', false);
    this.set('trackingError', null);
    this.set('showIgnored', false);
    this.set('trackedResult', null);
  },
});
