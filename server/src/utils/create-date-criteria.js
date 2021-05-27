/**
* Builds the lte/gte start/end date criteria.
*
* @param {?Date} params.startDate
* @param {?Date} params.endDate
*/
module.exports = ({ startDate, endDate }) => {
  if (!startDate && !endDate) return null;
  const dateCriteria = {};
  if (startDate) dateCriteria.$gte = startDate;
  if (endDate) dateCriteria.$lte = endDate;
  return dateCriteria;
};
