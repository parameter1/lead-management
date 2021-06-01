module.exports = ({
  brand,
  type,
  id,
  idType,
} = {}) => {
  if (!brand) throw new Error('A brand must be provided');
  if (!type) throw new Error('A type must be provided.');
  if (!id) throw new Error('An id must be provided.');
  const ns = ['omeda', brand, type].map((v) => v.trim().toLowerCase()).join('.');
  const entityId = [id, idType].filter((v) => v).map((v) => v.trim()).join('~');
  return `${ns}*${entityId}`;
};
