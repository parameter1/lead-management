/* eslint-disable no-await-in-loop */
const moment = require('moment');
const { get } = require('object-path');
const cms = require('./api/cms');
const Video = require('../models/video');

const { log } = console;

const run = async () => {
  const lastVideo = await Video.findOne({ 'externalSource.createdAt': { $exists: true } }, {}, { sort: { 'externalSource.createdAt': -1 } });
  const q = lastVideo ? `created_at:${lastVideo.externalSource.createdAt.toISOString()}` : undefined;
  const { count } = await cms.getVideoCount({ sort: 'created_at', q });
  const limit = 100;
  const numberOfPages = Math.ceil(count / limit);
  log({ numberOfPages });

  for (let n = 0; n < numberOfPages; n += 1) {
    const offset = n * limit;
    const videos = await cms.getVideos({
      limit,
      offset,
      sort: 'created_at',
      q,
    });
    const docs = videos.map((video) => {
      const externalSource = {
        identifier: video.id,
        namespace: 'Brightcove:Video',
        lastRetrievedAt: new Date(),
        createdAt: moment(video.created_at).toDate(),
        updatedAt: moment(video.updated_at).toDate(),
      };
      const publishedAt = video.published_at ? moment(video.published_at).toDate() : null;
      const thumbnail = get(video, 'images.thumbnail.src');
      const image = get(video, 'images.poster.src');
      return {
        externalSource,
        name: video.name,
        ...(video.description && { description: video.description }),
        ...(video.long_description && { body: video.long_description }),
        duration: video.duration,
        originalFilename: video.original_filename,
        ...(publishedAt && { publishedAt }),
        ...(image && { image }),
        ...(thumbnail && { thumbnail }),
        ...(video.state && { state: video.state }),
        ...(video.tags && { tags: video.tags }),
      };
    });
    if (q && n === 0) {
      // Must remove first video to prevent duplicate key.
      log('Removing duplicate');
      docs.shift();
    }
    await Video.insertMany(docs);
    log('Inserted page #', n + 1);
  }
  log('DONE!');
};

run().catch((e) => setImmediate(() => { throw e; }));
