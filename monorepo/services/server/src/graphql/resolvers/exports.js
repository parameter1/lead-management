const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { EXPORTS_S3_BUCKET, AWS_REGION } = require('../../env');
const Campaign = require('../../mongodb/models/campaign');
const Export = require('../../mongodb/models/export');
const micro = require('../../micro');

const client = new S3Client({ region: AWS_REGION });

/**
 * Creates a signed URL to allow downloading the file without authentication
 */
const sign = ({
  key,
  expiresIn = 15 * 60, // 15m link duration
}) => getSignedUrl(client, (new GetObjectCommand({
  Bucket: EXPORTS_S3_BUCKET,
  Key: key,
})), { expiresIn });

/**
 * Uploads data to the S3 bucket
 */
const upload = ({
  key,
  data,
  contentType = 'text/csv',
  filename,
}) => client.send(
  (new PutObjectCommand({
    Bucket: EXPORTS_S3_BUCKET,
    Key: key,
    Body: data,
    ContentType: contentType,
    ContentDisposition: `attachment; filename="${filename}"`,
  })),
);

const execute = async (model) => {
  const { action, hash, filename } = model;
  try {
    await model.set('status', 'running').save();
    const csv = await micro.exports.request(action, { hash });
    await upload({ key: model.key, filename, data: csv });
    await model.set('status', 'completed').save();
  } catch (e) {
    model.set('status', 'errored');
    model.set('errorMessage', e.message);
    model.save();
  }
};

module.exports = {
  /**
   *
   */
  Export: {
    url: ({ status, key }) => {
      if (status === 'completed' && key) {
        return sign({ key });
      }
      return null;
    },
  },
  /**
   *
   */
  Query: {
    /**
     *
     */
    exportStatus: async (_, { id }) => {
      const record = await Export.findById(id);
      if (!record) throw new Error(`No export found for ID ${id}.`);
      return record;
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createExport: async (_, { input }) => {
      const { action, hash, name } = input;
      const campaign = await Campaign.findByHash(hash);
      if (!campaign) throw new Error(`Could not find campaign using hash ${hash}!`);
      const filename = `${campaign.fullName} ${name}.csv`;
      const model = new Export({ action, hash, filename });
      await model.save();
      execute(model);
      return model;
    },
  },
};
