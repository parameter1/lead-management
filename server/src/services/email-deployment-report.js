const moment = require('moment-timezone');
const EmailCategory = require('../models/email-category');
const EmailDeployment = require('../models/email-deployment');
const EmailSend = require('../models/email-send');

const { isArray } = Array;

module.exports = {
  round(num, dec) {
    const sign = num >= 0 ? 1 : -1;
    // eslint-disable-next-line
    return parseFloat((Math.round((num * Math.pow(10, dec)) + (sign * 0.0001)) / Math.pow(10, dec)).toFixed(dec));
  },

  async export({ start, end }) {
    const results = await this.create({ start, end });
    if (!isArray(results.weeks)) return [];
    return results.weeks.reduce((arr, week) => {
      const { year, week: number, categories } = week;
      const row = {
        Year: year,
        Week: number + 1,
        Starting: moment().year(year).week(number + 1).startOf('week')
          .format('MMM D'),
      };
      const categoryRows = categories.reduce((r, category) => {
        const {
          name,
          deploymentIds,
          totalSent,
          totalDelivered,
          totalUniqueOpens,
          totalUniqueClicks,
          avgDeliveryRate,
          avgUniqueOpenRate,
          avgUniqueClickToDeliveredRate,
          avgUniqueClickToOpenRate,
        } = category;
        const numSent = deploymentIds.length;
        r.push({
          ...row,
          Category: name,
          '# Sent': numSent,
          'Total Sent': totalSent,
          'Avg. Sent': parseInt((totalSent || 0) / numSent, 10),
          'Avg. Delivered': parseInt((totalDelivered || 0) / numSent, 10),
          'Avg. Delivery Rate': this.round(avgDeliveryRate, 3),
          'Total Unique Opens': totalUniqueOpens,
          'Avg. Unique Opens': parseInt((totalUniqueOpens || 0) / numSent, 10),
          'Avg. Unq Open Rate': this.round(avgUniqueOpenRate, 3),
          'Total Unique Clicks': totalUniqueClicks,
          'Avg. Unique Clicks': parseInt((totalUniqueClicks || 0) / numSent, 10),
          'Avg. Unq CTR': this.round(avgUniqueClickToDeliveredRate, 3),
          'Avg. Unq CTOR': this.round(avgUniqueClickToOpenRate, 3),
        });
        return r;
      }, []);
      return [...arr, ...categoryRows];
    }, []);
  },

  async create({ start, end }) {
    const now = new Date();

    const starting = start
      ? moment.tz(start, 'America/Chicago').startOf('week').toDate()
      : moment.tz(now, 'America/Chicago').startOf('month').startOf('week').toDate();

    const ending = end
      ? moment.tz(end, 'America/Chicago').endOf('week').toDate()
      : moment.tz(now, 'America/Chicago').endOf('month').endOf('week').toDate();

    // Find all categories that are flagged as newsletters.
    // Also find all deploymentIds for sends falling inside the date range.
    const [categories, allDeploymentIds] = await Promise.all([
      EmailCategory.find({ isNewsletter: true }, { _id: 1 }),
      EmailSend.distinct('deploymentId', {
        sentDate: { $gte: starting, $lte: ending },
      }),
    ]);
    const categoryIds = categories.map((cat) => cat._id);

    // Now all eligible deployments using the categories and available deployment ids.
    const deployments = await EmailDeployment.find({
      _id: { $in: allDeploymentIds },
      categoryId: { $in: categoryIds },
    }, { _id: 1, name: 1 });
    const deploymentIds = deployments.map((dep) => dep._id);

    const divide = (dividend, divisor) => ({
      $cond: {
        if: { $eq: [divisor, 0] },
        then: 0,
        else: { $divide: [dividend, divisor] },
      },
    });

    // Now aggregate the send metrics by week, category, and only for sends that are allowed.
    const weeks = await EmailSend.aggregate([
      { $match: { deploymentId: { $in: deploymentIds }, isTestSend: { $ne: true } } },
      {
        $group: {
          _id: {
            deploymentId: '$deploymentId',
            year: { $year: '$sentDate' },
            week: { $week: '$sentDate' },
          },
          lastRetrievedAt: { $min: '$externalSource.lastRetrievedAt' },
          sent: { $sum: { $ifNull: ['$metrics.sent', 0] } },
          delivered: { $sum: { $ifNull: ['$metrics.delivered', 0] } },
          uniqueOpens: { $sum: { $ifNull: ['$metrics.uniqueOpens', 0] } },
          uniqueClicks: { $sum: { $ifNull: ['$metrics.uniqueClicks', 0] } },
          unsubscribes: { $sum: { $ifNull: ['$metrics.unsubscribes', 0] } },
          bounces: { $sum: { $ifNull: ['$metrics.bounces', 0] } },
        },
      },
      {
        $addFields: {
          deliveryRate: divide('$delivered', '$sent'),
          uniqueOpenRate: divide('$uniqueOpens', '$delivered'),
          uniqueClickToDeliveredRate: divide('$uniqueClicks', '$delivered'),
          uniqueClickToOpenRate: divide('$uniqueClicks', '$uniqueOpens'),
        },
      },
      {
        $lookup: {
          from: 'email-deployments',
          localField: '_id.deploymentId',
          foreignField: '_id',
          as: 'deployment',
        },
      },
      { $unwind: '$deployment' },
      {
        $group: {
          _id: {
            categoryId: '$deployment.categoryId',
            year: '$_id.year',
            week: '$_id.week',
          },
          lastRetrievedAt: { $min: '$lastRetrievedAt' },
          deploymentIds: { $push: '$deployment._id' },
          totalSent: { $sum: '$sent' },
          totalDelivered: { $sum: '$delivered' },
          totalUniqueOpens: { $sum: '$uniqueOpens' },
          totalUniqueClicks: { $sum: '$uniqueClicks' },
          totalUnsubscribes: { $sum: '$unsubscribes' },
          totalBounces: { $sum: '$bounces' },
          avgDeliveryRate: { $avg: '$deliveryRate' },
          avgUniqueOpenRate: { $avg: '$uniqueOpenRate' },
          avgUniqueClickToDeliveredRate: { $avg: '$uniqueClickToDeliveredRate' },
          avgUniqueClickToOpenRate: { $avg: '$uniqueClickToOpenRate' },
        },
      },
      {
        $lookup: {
          from: 'email-categories',
          localField: '_id.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $sort: { 'category.name': 1 } },
      {
        $group: {
          _id: {
            year: '$_id.year',
            week: '$_id.week',
          },
          lastRetrievedAt: { $min: '$lastRetrievedAt' },
          categories: {
            $push: {
              id: '$_id.categoryId',
              year: '$_id.year',
              week: '$_id.week',
              name: '$category.name',
              deploymentIds: '$deploymentIds',
              totalSent: '$totalSent',
              totalDelivered: '$totalDelivered',
              totalUniqueOpens: '$totalUniqueOpens',
              totalUniqueClicks: '$totalUniqueClicks',
              totalUnsubscribes: '$totalUnsubscribes',
              totalBounces: '$totalBounces',
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
          categories: 1,
        },
      },
      { $sort: { year: -1, month: -1, week: -1 } },
    ]);

    return {
      start: starting,
      end: ending,
      weeks,
    };
  },
};
