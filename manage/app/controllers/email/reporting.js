import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import moment from 'moment';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

import query from 'leads-manage/gql/queries/email-report/run';

export default Controller.extend(ComponentQueryManager, LoadingMixin, {
  center: moment(),
  isRunning: false,
  excludeDeploymentTypeEntities: false,

  canSubmit: computed('isRunning', 'range.{start,end}', function() {
    if (this.get('isRunning')) return false;
    if (this.get('range.start') && this.get('range.end')) return true;
    return false;
  }),

  start: computed('range.start', function() {
    const start = this.get('range.start');
    if (!start) return start;
    return start.valueOf();
  }),

  end: computed('range.end', function() {
    const end = this.get('range.end');
    if (!end) return end;
    return end.valueOf();
  }),

  exportUrl: computed('range.{start,end}', 'excludeDeploymentTypeEntities', 'deploymentTypeEntities.[]', function() {
    const { start, end } = this.getProperties('start', 'end');
    const types = this.get('deploymentTypeEntities');
    const exclude = this.get('excludeDeploymentTypeEntities');
    const entities = (types || []).map(type => encodeURIComponent(type.entity)).join(',');
    const params = new URLSearchParams();
    params.set('start', start);
    params.set('end', end);
    if (entities) {
      if (exclude) {
        params.set('excludeDeploymentTypeEntities', entities);
      } else {
        params.set('includeDeploymentTypeEntities', entities);
      }
    }
    return `/export/email-deployment-report?${params}`;
  }),

  init() {
    this._super(...arguments);
    this.set('range', {
      start: moment().startOf('week'),
      end: moment().endOf('week'),
    });
    this.set('deploymentTypeEntities', []);
  },

  actions: {
    setRange(range) {
      const { start, end } = range;
      this.set('range', {
        start: start ? moment(start).startOf('week') : start,
        end: end ? moment(end).endOf('week') : end,
      });
    },

    async runReport() {
      if (this.get('canSubmit')) {
        this.set('isRunning', true);
        this.showLoading();

        const types = this.get('deploymentTypeEntities');
        const exclude = this.get('excludeDeploymentTypeEntities');
        const entities = (types || []).map(type => type.entity);

        const input = {
          start: this.get('range.start').valueOf(),
          end: this.get('range.end').valueOf(),
          ...(entities.length && {
            ...(exclude ? { excludeDeploymentTypeEntities: entities } : { includeDeploymentTypeEntities: entities })
          })
        }
        const variables = { input };

        try {
          const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailDeploymentReport');
          this.set('result', result);
        } catch (e) {
          this.get('graphErrors').show(e);
        } finally {
          this.hideLoading();
          this.set('isRunning', false);
        }
      }
    },
  },
});
