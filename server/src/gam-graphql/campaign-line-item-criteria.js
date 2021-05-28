const { isArray } = Array;

module.exports = ({ startDate, endDate, gamAdvertiserIds } = {}) => {
  if (!isArray(gamAdvertiserIds) || !gamAdvertiserIds.length) throw new Error('GAM Advertiser IDs must be provided.');
  const criteria = [];
  criteria.push(`advertiserId IN (${gamAdvertiserIds.join(',')})`);
  if (startDate && endDate) {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    criteria.push(`AND ((startDateTime <= '${start}' AND endDateTime >= '${start}') OR (startDateTime <= '${end}' AND endDateTime >= '${end}') OR (startDateTime >= '${start}' AND endDateTime <= '${end}'))`);
  } else if (startDate) {
    criteria.push(`AND (startDateTime >= '${startDate.toISOString()}' OR endDateTime >= '${startDate.toISOString()}')`);
  } else if (endDate) {
    criteria.push(`AND startDateTime <= '${endDate.toISOString()}'`);
  }
  return criteria.join(' ');
};
