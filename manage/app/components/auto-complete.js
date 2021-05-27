import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({

  closeOnSelect: true,
  allowClear: true,
  multiple: false,
  timeout: 600,
  selected: null,
  placeholder: null,
  disabled: false,

  search: task(function* (term) {
    yield timeout(this.get('timeout'));
    return this.get('on-search')(term);
  }),
});
