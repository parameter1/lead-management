const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const BehaviorView = require('../../models/behavior/view');
const ContentQueryResult = require('../../models/content-query/result');
const Identity = require('../../models/identity');
const User = require('../../models/user');

module.exports = {
  /**
   *
   */
  ContentQueryResult: {
    identityCount: (result) => result.identityIds.length,
    ranBy: (result) => User.findById(result.ranById),
  },

  /**
   *
   */
  ContentQueryResultConnection: paginationResolvers.connection,

  /**
   *
   */
  ContentQueryResultRowConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    contentQueryResult: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await ContentQueryResult.findOne({ _id: id, deleted: false });
      if (!record) throw new Error(`No query record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allContentQueryResults: (root, { queryId, pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { queryId, deleted: false };
      return new Pagination(ContentQueryResult, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchContentQueryResults: (root, {
      queryId,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const criteria = { queryId, deleted: false };
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(ContentQueryResult, pagination);
    },

    /**
     *
     */
    allContentQueryResultRows: async (root, { resultId, pagination, sort }, { auth }) => {
      auth.check();
      const record = await ContentQueryResult.findOne({ _id: resultId, deleted: false });
      if (!record) throw new Error(`No query record found for ID ${resultId}.`);

      const criteria = { _id: { $in: record.identityIds } };
      return new Pagination(Identity, { pagination, criteria, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createContentQueryResult: async (root, { input }, { auth }) => {
      auth.check();
      const {
        queryId,
        startDate,
        endDate,
        contentIds,
      } = input;

      const entities = contentIds.map((id) => `${id}*.www-ien-com.content`);
      const result = await BehaviorView.aggregate([
        {
          $match: {
            day: { $gte: startDate, $lte: endDate },
            ent: { $in: entities },
          },
        },
        {
          $group: {
            _id: '$usr',
            views: { $sum: '$n' },
          },
        },
        {
          $group: {
            _id: null,
            userCount: { $sum: 1 },
            users: { $push: '$_id' },
            views: { $sum: '$views' },
          },
        },
      ]);

      const queryResult = new ContentQueryResult({
        queryId,
        startDate,
        endDate,
        contentCount: contentIds.length,
        ranAt: new Date(),
        ranById: auth.user.id,
        identityIds: [],
      });

      const data = result[0];
      if (data) {
        const { users } = data;
        const subscriberIds = users.map((usr) => usr.split('*')[0]);

        const found = await Identity.find({
          inactive: false,
          'externalSource.namespace': 'FuelSOAP:Subscriber',
          'externalSource.identifier': { $in: subscriberIds },
        }, { _id: 1 });

        queryResult.identityIds = found.map((o) => o._id);
      }
      return queryResult.save();
    },
  },
};
