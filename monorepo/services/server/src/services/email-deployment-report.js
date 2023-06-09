const dayjs = require('../dayjs');
const EmailDeployment = require('../mongodb/models/omeda/email-deployment');

const { isArray } = Array;

module.exports = {
  round(num, dec) {
    const sign = num >= 0 ? 1 : -1;
    // eslint-disable-next-line
    return parseFloat((Math.round((num * Math.pow(10, dec)) + (sign * 0.0001)) / Math.pow(10, dec)).toFixed(dec));
  },

  async export({
    start,
    end,
    includeOmedaDeploymentTypeIds = [],
    excludeOmedaDeploymentTypeIds = [],
  }) {
    const results = await this.create({
      start,
      end,
      includeOmedaDeploymentTypeIds,
      excludeOmedaDeploymentTypeIds,
    });
    if (!isArray(results.weeks)) return [];
    return results.weeks.reduce((arr, week) => {
      const { year, week: weekNumber, types } = week;
      const row = {
        Year: year,
        Week: weekNumber,
        Starting: dayjs().year(year).week(weekNumber).startOf('week')
          .format('MMM D'),
      };
      const typeRows = types.reduce((r, type) => {
        const {
          name,
          deploymentCount,
          totalSent,
          totalDelivered,
          totalUniqueOpens,
          totalUniqueClicks,
          avgDeliveryRate,
          avgUniqueOpenRate,
          avgUniqueClickToDeliveredRate,
          avgUniqueClickToOpenRate,
        } = type;
        r.push({
          ...row,
          Category: name,
          '# Sent': deploymentCount,
          'Total Sent': totalSent,
          'Avg. Sent': parseInt((totalSent || 0) / deploymentCount, 10),
          'Avg. Delivered': parseInt((totalDelivered || 0) / deploymentCount, 10),
          'Avg. Delivery Rate': this.round(avgDeliveryRate, 3),
          'Total Unique Opens': totalUniqueOpens,
          'Avg. Unique Opens': parseInt((totalUniqueOpens || 0) / deploymentCount, 10),
          'Avg. Unq Open Rate': this.round(avgUniqueOpenRate, 3),
          'Total Unique Clicks': totalUniqueClicks,
          'Avg. Unique Clicks': parseInt((totalUniqueClicks || 0) / deploymentCount, 10),
          'Avg. Unq CTR': this.round(avgUniqueClickToDeliveredRate, 3),
          'Avg. Unq CTOR': this.round(avgUniqueClickToOpenRate, 3),
        });
        return r;
      }, []);
      return [...arr, ...typeRows];
    }, []);
  },

  async create({
    start,
    end,
    includeOmedaDeploymentTypeIds = [],
    excludeOmedaDeploymentTypeIds = [],
  }) {
    const now = new Date();

    const starting = start
      ? dayjs.tz(start, 'America/Chicago').startOf('week').toDate()
      : dayjs.tz(now, 'America/Chicago').startOf('month').startOf('week').toDate();

    const ending = end
      ? dayjs.tz(end, 'America/Chicago').endOf('week').toDate()
      : dayjs.tz(now, 'America/Chicago').endOf('month').endOf('week').toDate();

    const divide = (dividend, divisor) => ({
      $cond: {
        if: { $eq: [divisor, 0] },
        then: 0,
        else: { $divide: [dividend, divisor] },
      },
    });

    // Aggregate deployment metrics by week and deployment type
    // where deployment is a newletter within the date range.
    const weeks = await EmailDeployment.aggregate([
      {
        $match: {
          'omeda.SentDate': { $gte: starting, $lte: ending },
          'omeda.DeploymentDesignation': 'Newsletter',
          ...((includeOmedaDeploymentTypeIds.length || excludeOmedaDeploymentTypeIds.length) && {
            'omeda.DeploymentTypeId': {
              ...(includeOmedaDeploymentTypeIds.length && { $in: includeOmedaDeploymentTypeIds }),
              ...(excludeOmedaDeploymentTypeIds.length && { $nin: excludeOmedaDeploymentTypeIds }),
            },
          }),
        },
      },
      {
        $group: {
          _id: {
            type: '$omeda.DeploymentTypeDescription',
            year: { $year: '$omeda.SentDate' },
            week: { $add: [{ $week: '$omeda.SentDate' }, 1] },
          },
          deploymentIds: { $addToSet: '$_id' },
          lastRetrievedAt: { $min: '$lastRetrievedAt' },
          totalSent: { $sum: { $ifNull: ['$omeda.RecipientCount', 0] } },
          totalDelivered: { $sum: { $ifNull: ['$omeda.SentCount', 0] } },
          totalUniqueOpens: { $sum: { $ifNull: ['$omeda.UniqueOpens', 0] } },
          totalUniqueClicks: { $sum: { $ifNull: ['$omeda.UniqueClicks', 0] } },
          totalUnsubscribes: { $sum: { $ifNull: ['$omeda.TotalUnsubscribe', 0] } },
          totalBounces: { $sum: { $ifNull: ['$omeda.BounceCount', 0] } },
        },
      },
      {
        $addFields: {
          deploymentCount: { $size: '$deploymentIds' },
        },
      },
      {
        $addFields: {
          avgSent: divide('$totalSent', '$deploymentCount'),
          avgDelivered: divide('$totalDelivered', '$deploymentCount'),
          avgUniqueOpens: divide('$totalUniqueOpens', '$deploymentCount'),
          avgUniqueClicks: divide('$totalUniqueClicks', '$deploymentCount'),
          avgDeliveryRate: divide('$totalDelivered', '$totalSent'),
          avgUniqueOpenRate: divide('$totalUniqueOpens', '$totalDelivered'),
          avgUniqueClickToDeliveredRate: divide('$totalUniqueClicks', '$totalDelivered'),
          avgUniqueClickToOpenRate: divide('$totalUniqueClicks', '$totalUniqueOpens'),
        },
      },

      {
        $group: {
          _id: { year: '$_id.year', week: '$_id.week' },
          lastRetrievedAt: { $min: '$lastRetrievedAt' },
          types: {
            $push: {
              name: '$_id.type',
              year: '$_id.year',
              week: '$_id.week',
              deploymentIds: '$deploymentIds',
              deploymentCount: '$deploymentCount',
              totalSent: '$totalSent',
              totalDelivered: '$totalDelivered',
              totalUniqueOpens: '$totalUniqueOpens',
              totalUniqueClicks: '$totalUniqueClicks',
              avgSent: '$avgSent',
              avgDelivered: '$avgDelivered',
              avgUniqueOpens: '$avgUniqueOpens',
              avgUniqueClicks: '$avgUniqueClicks',
              avgDeliveryRate: '$avgDeliveryRate',
              avgUniqueOpenRate: '$avgUniqueOpenRate',
              avgUniqueClickToDeliveredRate: '$avgUniqueClickToDeliveredRate',
              avgUniqueClickToOpenRate: '$avgUniqueClickToOpenRate',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          week: '$_id.week',
          lastRetrievedAt: 1,
          types: 1,
        },
      },
      { $sort: { year: -1, week: -1 } },
    ]);

    return {
      start: starting,
      end: ending,
      weeks,
    };
  },
};
