const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const { get, getAsArray } = require('@parameter1/utils');
const gql = require('graphql-tag');
const { Parser } = require('json2csv');
const dayjs = require('../../dayjs');
const getAllEdges = require('../../utils/get-all-edges');

const CAMPAIGN_QUERY = gql`
  query ExportEmailCampaignExcludedFields($hash: String!) {
    campaignByHash(hash: $hash) {
      id
      email {
        id
        identityAttributes {
          key
          label
        }
      }
    }
  }
`;

const QUERY = gql`
  query ExportCampaignEmailLeads($hash: String!, $pagination: PaginationInput, $sort: IdentitySortInput) {
    reportEmailIdentityExport(hash: $hash, pagination: $pagination, sort: $sort) {
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
        cursor
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

  const { data } = await apollo.query({ query: CAMPAIGN_QUERY, variables: { hash } });
  const identityAttributes = getAsArray(data, 'campaignByHash.email.identityAttributes');

  const edges = await getAllEdges(apollo, {
    opName: 'reportEmailIdentityExport',
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
