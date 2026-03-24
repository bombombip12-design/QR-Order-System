function notFound(req, res) {
  res
    .status(404)
    .json({ message: `Endpoint not found: ${req.method} ${req.originalUrl}` });
}

module.exports = notFound;
