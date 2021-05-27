module.exports = (value) => {
  const parsed = parseInt(value, 10);
  return parsed && parsed > 0 ? parsed : undefined;
};
