import Component from '@ember/component';
import { computed, get } from '@ember/object';
import moment from 'moment';
import numeral from 'numeral';

export default Component.extend({
  totalIdentityCount: 0,

  _series: computed('sends.[]', function() {
    const series = {
      type: 'pie',
      name: 'Leads from this send',
      data: [],
    };

    const count = this.get('totalIdentityCount');
    this.get('sends').forEach((send) => {
      const countForSend = get(send, 'identities');
      if (countForSend && count) {
        series.data.pushObject({
          y: countForSend / count,
          name: `${get(send, 'send.name')} (Sent: ${moment(get(send, 'send.sentDate')).format('MMM Do, YYYY @ h:mma')})`,
          dataLabels: { enabled: false },
        });
      }
    });
    return series;
  }),

  didInsertElement() {
    this.$().highcharts({
      title: {
          text: null
      },
      tooltip: {
        formatter: function() {
          return '<b>'+ this.point.name +'</b><br/>'+
            this.series.name +': '+
            numeral(this.y).format('0.0%')
          ;
        }
      },
      series: [this.get('_series')],
    });
  }
});
