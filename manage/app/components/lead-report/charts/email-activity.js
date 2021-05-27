import Component from '@ember/component';
import { computed } from '@ember/object';
import numeral from 'numeral';

export default Component.extend({
  count: 0,

  _series: computed('totals.{delivered,uniqueOpens,uniqueClicks,bounced,count}', function() {
    return {
      type: 'pie',
      name: `${this.get('count')} Deployments(s)`,
      data: [
        { y: this.get('totals.delivered'), name: 'Delivered' },
        { y: this.get('totals.uniqueOpens'), name: 'Opened', sliced: true },
        { y: this.get('totals.uniqueClicks'), name: 'Clicked', sliced: true },
        { y: this.get('totals.bounces'), name: 'Bounced' },
      ],
    };
  }),

  didInsertElement() {
    const _this = this;
    this.$().highcharts({
      title: {
          text: null
      },
      tooltip: {
        formatter: function() {
          return '<b>'+ this.point.name +'</b><br/>'+
            this.series.name +': '+
            numeral(this.y).format('0,0') + ' of ' +
            numeral(_this.get('totals.sent')).format('0,0') + ' sent ' +
            '(' + numeral(this.y / _this.get('totals.sent')).format('00.0%') + ')'
          ;
        }
      },
      series: [this.get('_series')],
    });
  }
});
