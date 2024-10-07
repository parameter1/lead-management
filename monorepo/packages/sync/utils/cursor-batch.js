const { hrtime } = require('process');
const { inspect } = require('util');
const { iterateCursor } = require('@lead-management/mongodb/utils');

const getMS = ([secs, ns]) => Math.round((secs * 1000) + (ns / 1000000));

const round = (value, digits = 2) => {
  const precision = 10 ** digits;
  return Math.round((value + Number.EPSILON) * precision) / precision;
};

/**
 * @param {CursorBatchParams} params
 */
const cursorBatch = async ({
  beforeId,
  collection,
  filter,
  handler,
  log = console.log, // eslint-disable-line
  page = 1,
  pipeline,
  size = 250,
  totalCount,
} = {}) => {
  const $and = [];
  $and.push(filter || {});

  const logger = typeof log === 'function' ? log : () => {};

  /** @type {number} */
  let count;
  if (!totalCount) {
    logger('retrieving total count...');
    const [doc] = await collection.aggregate([
      { $match: { $and } },
      ...pipeline || [],
      { $group: { _id: null, n: { $sum: 1 } } },
    ]).toArray();
    count = doc && doc.n ? doc.n : 0;
    logger(`found ${count.toLocaleString()} total documents`);
  }

  const total = totalCount || count;
  if (!total) return 0;

  const start = hrtime();

  if (beforeId) $and.push({ _id: { $lt: beforeId } });
  const pipe = [
    { $match: { $and } },
    { $sort: { _id: -1 } },
    ...pipeline || [],
    { $limit: size },
  ];
  if (!beforeId) logger('running with pipeline', inspect(pipe, { colors: true, depth: null }));
  const cursor = await collection.aggregate(pipe);

  const results = [];

  let nextId;
  let processed = 0;
  await iterateCursor(cursor, (doc) => {
    nextId = doc._id;
    results.push(doc);
    processed += 1;
  });
  await cursor.close();

  if (results.length) await handler({ results });

  const hasNextPage = Boolean(nextId) && total >= page * size;

  const stop = hrtime(start);
  const ms = getMS(stop);

  let percent = 100;
  if (total) {
    percent = hasNextPage ? round(((page * size) / total) * 100, 1) : 100;
  }

  logger(`processed ${processed} documents (${percent}%) (${ms}ms)${beforeId ? ` (before: ${beforeId})` : ''} (has next page: ${hasNextPage})`);

  if (hasNextPage) {
    await cursorBatch({
      beforeId: nextId,
      collection,
      filter,
      handler,
      log,
      page: page + 1,
      pipeline,
      size,
      totalCount: total,
    });
  }
  return count;
};

module.exports = cursorBatch;

/**
 * @typedef CursorBatchParams
 * @prop {import("mongodb").ObjectId} [beforeId]
 * @prop {import("mongodb").Collection} collection
 * @prop {Record<string, any>}  [filter]
 * @prop {CursorBatchHandlerFn} handler
 * @prop {Function} [log]
 * @prop {number} [page]
 * @prop {Record<string, any>[]} [pipeline]
 * @prop {number} [size]
 * @prop {number} [totalCount]
 *
 * @callback CursorBatchHandlerFn
 * @param {CursorBatchHandlerFnParams} params
 *
 * @typedef CursorBatchHandlerFnParams
 * @prop {Record<string, any>[]} results
 */
