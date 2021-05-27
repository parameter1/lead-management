// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const error = {
    status: String(statusCode),
    title: err.name || 'Internal Server Error',
    detail: err.message || 'An unknown, fatal error occurred!',
  };

  if (process.env.NODE_ENV !== 'production') {
    error.meta = { stack: err.stack.split('\n') };
  }

  res.status(statusCode).json({ error });
};
