module.exports = (retry, err) => {
  if (err.code !== 11000) throw err;
  retry(err);
};
