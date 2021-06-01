module.exports = ({
  brand,
  type,
  id,
  idType,
} = {}) => {
  const ns = ['omeda', brand, type].map((v) => v.trim().toLowerCase()).join('.');
  const entityId = [id, idType].filter((v) => v).map((v) => v.trim()).join('~');
  return `${ns}*${entityId}`;
};
