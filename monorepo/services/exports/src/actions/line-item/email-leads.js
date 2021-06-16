const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const { get, getAsArray } = require('@parameter1/utils');
const gql = require('graphql-tag');
const { Parser } = require('json2csv');
const dayjs = require('../../dayjs');
const getAllEdges = require('../../utils/get-all-edges');

const LINEITEM_QUERY = gql`
  query ExportEmailLineItemExcludedFields($hash: String!) {
    lineItemByHash(input: { hash: $hash }) {
      id
      ... on EmailLineItem {
        identityAttributes {
          key
          label
        }
      }
    }
  }
`;

const QUERY = gql`
  query ExportLineItemEmailLeads($hash: String!, $pagination: PaginationInput, $sort: IdentitySortInput) {
    emailLineItemIdentityExportReport(hash: $hash, pagination: $pagination, sort: $sort) {
      totalCount
      edges {
        node {
          clicks
          identity {
            id
            entity
            emailAddress
            givenName
            familyName
            title
            companyName
            street
            city
            region
            postalCode
            country
            phoneNumber
            attributes
            fieldCount
          }
          deployments {
            id
            sentDate
            name
          }
          urls {
            id
            values {
              resolved
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

module.exports = async (params = {}, { context }) => {
  const { hash } = await validateAsync(Joi.object({
    hash: Joi.string().trim().pattern(/[a-f0-9]{32}/).required(),
  }).required(), params);

  const { apollo } = context;
  const variables = { hash, sort: { field: 'fieldCount', order: -1 }, pagination: { first: 500 } };

  const { data } = await apollo.query({ query: LINEITEM_QUERY, variables: { hash } });
  const identityAttributes = getAsArray(data, 'lineItemByHash.identityAttributes');

  const edges = await getAllEdges(apollo, {
    opName: 'emailLineItemIdentityExportReport',
    query: QUERY,
    variables,
  });

  const rows = edges.map(({ node }) => {
    const { identity, deployments, urls } = node;

    const row = identityAttributes.reduce((o, { key, label }) => {
      const value = get(identity, key) || '';
      return { ...o, [label]: value };
    }, {});
    row.URLs = urls.map((d) => get(d, 'values.resolved')).join(', ');
    row.Deployments = deployments.map((d) => `${d.name} (Sent: ${dayjs.tz(d.sentDate, 'America/Chicago').format('MM/DD/YYYY h:mma')})`).join(', ');
    row.Clicks = node.clicks;
    return row;
  });
  if (!rows.length) return '';
  const parser = new Parser({
    fields: Object.keys(rows[0]),
  });
  return parser.parse(rows);
};
