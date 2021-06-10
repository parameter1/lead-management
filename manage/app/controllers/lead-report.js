import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  displayEmail: computed('model.{email.enabled,email.hasDeployments}', function() {
    return Boolean(this.get('model.email.enabled') && this.get('model.email.hasDeployments'));
  }),
  displayAds: computed('model.{ads.enabled,ads.hasIdentities}', function() {
    return Boolean(this.get('model.ads.enabled') && this.get('model.ads.hasIdentities'));
  }),
  displayForms: computed('model.{forms.enabled,forms.forms.length}', function() {
    return Boolean(this.get('model.forms.enabled') && this.get('model.forms.forms.length'));
  }),
  displayAdMetrics: computed('model.{adMetrics.enabled,customer.linkedAdvertisers.googleAdManager.nodes.length}', function() {
    return Boolean(this.get('model.adMetrics.enabled') && this.get('model.customer.linkedAdvertisers.googleAdManager.nodes.length'));
  }),
  displayVideoMetrics: computed('model.{videoMetrics.enabled,customer.linkedVideos.brightcove.nodes.length}', function() {
    return Boolean(this.get('model.videoMetrics.enabled') && this.get('model.customer.linkedVideos.brightcove.nodes.length'));
  }),
});
