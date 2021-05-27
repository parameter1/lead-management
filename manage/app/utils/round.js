export default (value, digits = 2) => {
  const precision = 10 ** digits;
  return Math.round((value + Number.EPSILON) * precision) / precision;
};
