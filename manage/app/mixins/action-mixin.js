import Mixin from '@ember/object/mixin';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

export default Mixin.create(LoadingMixin, {
  isActionRunning: false,

  startAction() {
    this.showLoading();
    this.set('isActionRunning', true);
  },

  endAction() {
    this.set('isActionRunning', false);
    this.hideLoading();
  },

  startRouteAction() {
    this.showLoading();
    const controller = this.controllerFor(this.get('routeName'));
    controller.set('isActionRunning', true);
  },

  endRouteAction() {
    const controller = this.controllerFor(this.get('routeName'));
    controller.set('isActionRunning', false);
    this.hideLoading();
  },

  sendEventAction(name, ...args) {
    const fn = this.get(name);
    if (typeof fn === 'function') return fn(...args);
  },
});
