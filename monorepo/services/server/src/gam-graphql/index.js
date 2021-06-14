const { gql } = require('apollo-server-express');
const { pluralize } = require('inflected');
const { get } = require('@parameter1/utils');
const create = require('./create-client');
const extractFragmentData = require('../graphql/utils/extract-fragment-data');

const { isArray } = Array;

class GAMGraphQLClient {
  constructor({ uri } = {}) {
    this.client = create({ uri });
  }

  async findByID({
    id,
    type,
    fragment,
    strict = true,
  } = {}) {
    if (!id) return null;
    const { spreadFragmentName, processedFragment } = extractFragmentData(fragment);
    try {
      const { data } = await this.client.query({
        query: gql`
          query FindManyByIDs($id: BigInt!, $strict: Boolean!) {
            ${type}: _${type}(input: {
              id: $id,
              strict: $strict,
            }) {
              ${spreadFragmentName}
            }
          }
          ${processedFragment}
        `,
        variables: { id, strict },
      });
      return data[type];
    } catch (e) {
      throw GAMGraphQLClient.formatError(e);
    }
  }

  async findManyByIDs({
    ids,
    type,
    fragment,
  }) {
    if (!isArray(ids) || !ids.length) throw new Error('The `ids` parameter must be provided.');
    const where = `id IN (${ids.join(',')})`;
    return this.find({ type, where, fragment });
  }

  async find({
    type,
    where,
    orderBy,
    limit,
    offset,
    fragment,
  }) {
    const operation = pluralize(type);
    const { spreadFragmentName, processedFragment } = extractFragmentData(fragment);
    try {
      const { data } = await this.client.query({
        query: gql`
          query Find($where: String, $orderBy: String, $limit: Int, $offset: Int) {
            ${operation}: _${operation}(input: {
              where: $where,
              orderBy: $orderBy,
              limit: $limit,
              offset: $offset,
            }) {
              totalCount
              nodes {
                ${spreadFragmentName}
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                nextOffset
                previousOffset
              }
            }
          }

          ${processedFragment}
        `,
        variables: {
          where,
          orderBy,
          limit,
          offset,
        },
      });
      return data[operation];
    } catch (e) {
      throw GAMGraphQLClient.formatError(e);
    }
  }

  static formatError(e) {
    const networkError = get(e, 'networkError.result.errors.0.message');
    const graphQLError = get(e, 'graphQLErrors.0.message');
    if (!networkError && !graphQLError) return e;
    const err = new Error(networkError || graphQLError);
    err.originalError = e;
    return err;
  }
}

module.exports = GAMGraphQLClient;
