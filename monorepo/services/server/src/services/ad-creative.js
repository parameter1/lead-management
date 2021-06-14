const { gql } = require('apollo-server-express');
const { get } = require('@parameter1/utils');
const GAMGraphQLClient = require('../gam-graphql');
const { GAM_GRAPHQL_URI } = require('../env');

module.exports = {
  async getDetail({ cid, lid } = {}) {
    if (!cid || !lid) throw new Error('The creative and lineitem IDs are required.');
    const graphql = new GAMGraphQLClient({ uri: GAM_GRAPHQL_URI });

    const [creative, lineItem] = await Promise.all([
      graphql.findByID({
        id: cid,
        type: 'creative',
        strict: false,
        fragment: gql`
          fragment AdCreativeServiceCreative on CreativeInterface {
            id
            name
            advertiserId
            size {
              width
              height
            }
            __typename
          }
        `,
      }),
      graphql.findByID({
        id: lid,
        type: 'lineItem',
        strict: false,
        fragment: gql`
          fragment AdCreativeServiceLineItem on LineItem {
            id
            name
            orderId
            orderName
            stats {
              impressionsDelivered
              clicksDelivered
              videoCompletionsDelivered
              videoStartsDelivered
              viewableImpressionsDelivered
            }
          }
        `,
      }),
    ]);
    if (!creative || !lineItem) return null;
    return {
      identifier: creative.id,
      name: creative.name,
      type: creative.__typename,
      width: get(creative, 'size.width'),
      height: get(creative, 'size.height'),
      advertiser: {
        identifier: creative.advertiserId,
      },
      order: {
        identifier: lineItem.orderId,
        name: lineItem.orderName,
      },
      lineitem: {
        identifier: lineItem.id,
        name: lineItem.name,
        metrics: lineItem.stats,
      },
    };
  },
};
