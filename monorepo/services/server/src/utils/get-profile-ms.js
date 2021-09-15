module.exports = (start) => {
  const [secs, ns] = process.hrtime(start);
  return (secs * 1000) + (ns / 1000000);
};
