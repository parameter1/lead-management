import gql from 'graphql-tag';
import fragment from 'leads-manage/gql/fragments/campaign/hash';
import withGAM from 'leads-manage/gql/fragments/campaign/hash-with-gam';

export default ({ enableGAM = true }) => gql`
query ViewCampaignByHash($hash: String!) {
  campaignByHash(hash: $hash) {
    ...${enableGAM ? 'CampaignHashWithGAMFragment' : 'CampaignHashFragment'}
  }
}
${enableGAM ? withGAM : fragment}
`;
