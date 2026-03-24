const paymentMethodService = require('../services/paymentMethodService');
const asyncHandler = require('../utils/asyncHandler');

const paymentMethodController = {
  list: asyncHandler(async (req, res) => {
    const methods = await paymentMethodService.list();
    res.json(methods);
  }),

  create: asyncHandler(async (req, res) => {
    const method = await paymentMethodService.create(req.body || {});
    res.status(201).json({ method });
  }),

  update: asyncHandler(async (req, res) => {
    const method = await paymentMethodService.update(req.params.id, req.body || {});
    res.json({ method });
  }),

  patchActive: asyncHandler(async (req, res) => {
    const { active } = req.body || {};
    const method = await paymentMethodService.patchActive(req.params.id, active);
    res.json({ method });
  }),
};

module.exports = paymentMethodController;

