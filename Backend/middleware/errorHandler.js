const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  let status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
  }
  res.status(status).json({ message });
};

module.exports = errorHandler;
