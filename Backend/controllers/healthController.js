function healthCheck(_req, res) {
  res.json({ ok: true, service: "qr-restaurant-backend" });
}

module.exports = {
  healthCheck,
};
