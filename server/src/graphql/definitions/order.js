const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allOrders(pagination: PaginationInput = {}, sort: OrderSortInput = {}): OrderConnection!
  searchOrders(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): OrderConnection!
  order(input: ModelIdInput!): Order!
}

extend type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  updateOrder(input: UpdateOrderInput!): Order!
}

type Order {
  id: String!
  hash: String!
  name: String
  fullName: String!
  customer: Customer!
  salesRep: User!
  lineitems: [LineItem]
  notes: String
  deleted: Boolean!
  createdAt: Date
  updatedAt: Date
}

type OrderConnection {
  totalCount: Int!
  edges: [OrderEdge]!
  pageInfo: PageInfo!
}

type OrderEdge {
  node: Order!
  cursor: String!
}

enum OrderSortField {
  fullName
  createdAt
  updatedAt
}

input OrderSortInput {
  field: OrderSortField! = createdAt
  order: Int! = -1
}

input CreateOrderInput {
  name: String
  customerId: String!
  salesRepId: String!
  notes: String
}

input UpdateOrderInput {
  id: String!
  name: String
  customerId: String!
  salesRepId: String!
  notes: String
}

input OrderStatusInput {
  id: String!
  enabled: Boolean!
}

`;
