const gql = require('graphql-tag');

const QUERY = gql`
  query ExportIdentities($input: QueryIdentityExportInput!) {
    identityExport(input: $input) {
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
    }
  }
`;

module.exports = async (params = {}, { context }) => {
  const { emails } = params;
  const { apollo, authorization } = context;
  const variables = { input: { emails } };
  const { data } = await apollo.query({
    query: QUERY,
    variables,
    context: { headers: { authorization } },
  });
  return data.identityExport;
};
