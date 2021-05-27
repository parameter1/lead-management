const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  currentUser: User
  checkSession(input: SessionTokenInput!): Authentication
  user(input: ModelIdInput!): User!
  searchUsers(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): UserConnection!
  allUsers(pagination: PaginationInput = {}, sort: UserSortInput = {}): UserConnection!
}

extend type Mutation {
  createUser(input: CreateUserInput!): User
  updateUser(input: UpdateUserInput!): User
  deleteUser(input: ModelIdInput!): String!
  loginUser(input: LoginInput!): Authentication
  deleteSession: String
  changeUserPassword(input: ChangeUserPasswordInput!): User
  updateCurrentUserProfile(input: CurrentUserProfileInput!): User
}

type Session {
  id: String!
  uid: String!
  cre: Int!
  exp: Int!
  token: String!
}

type Authentication {
  user: User!
  session: Session!
}

type User {
  id: String!
  email: String!
  role: String
  givenName: String
  familyName: String
  logins: Int
  photoURL: String
  createdAt: Date
  updatedAt: Date
}

type UserConnection {
  totalCount: Int!
  edges: [UserEdge]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

input UserSortInput {
  field: UserSortField! = createdAt
  order: Int! = -1
}

enum UserSortField {
  email
  givenName
  familyName
  createdAt
  updatedAt
}

enum UserRoleField {
  Administrator
  Member
  Restricted
}

input NewUserPayloadInput {
  email: String!
  password: String!
  confirmPassword: String!
  givenName: String!
  familyName: String!
  role: UserRoleField! = Restricted
}

input UpdateUserInput {
  id: String!
  payload: UpdateUserPayloadInput!
}

input UpdateUserPayloadInput {
  email: String!
  givenName: String!
  familyName: String!
  role: UserRoleField! = Restricted
}

input ChangeUserPasswordInput {
  id: String!
  value: String!
  confirm: String!
}

input CurrentUserProfileInput {
  givenName: String!
  familyName: String!
}

input CreateUserInput {
  # captcha: String
  payload: NewUserPayloadInput
}

input SessionTokenInput {
  token: String!
}

input LoginInput {
  email: String!
  password: String!
}

`;
