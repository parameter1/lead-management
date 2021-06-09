const { isArray } = Array;

module.exports = ({ startDate, endDate, gamAdvertiserIds } = {}) => {
  if (!isArray(gamAdvertiserIds) || !gamAdvertiserIds.length) throw new Error('GAM Advertiser IDs must be provided.');
  const criteria = [];
  criteria.push(`advertiserId IN (${gamAdvertiserIds.join(',')})`);
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  criteria.push(`AND ((startDateTime <= '${start}' AND endDateTime >= '${start}') OR (startDateTime <= '${end}' AND endDateTime >= '${end}') OR (startDateTime >= '${start}' AND endDateTime <= '${end}'))`);
  return criteria.join(' ');
};
