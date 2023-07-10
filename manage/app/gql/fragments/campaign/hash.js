import gql from 'graphql-tag';

export default gql`
fragment CampaignHashFragment on Campaign {
  id
  fullName
  hash
  maxIdentities
  range {
    start
    end
  }
  customer {
    id
    name
    linkedVideos {
      brightcove {
        nodes {
          id
        }
      }
    }
  }
  email {
    id
    enabled
    excludeFields
    displayDeliveredMetrics
    hasDeployments
  }
  # forms {
  #   id
  #   enabled
  #   forms(refreshEntries: false) {
  #     id
  #   }
  # }
  ads {
    id
    enabled
    excludeFields
    hasIdentities
  }
  adMetrics {
    id
    enabled
  }
  videoMetrics {
    id
    enabled
  }
}
`;
