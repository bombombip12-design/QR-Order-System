const feedbackService = require('../services/feedbackService');
const asyncHandler = require('../utils/asyncHandler');

const feedbackController = {
  submitRating: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { rating, comment } = req.body || {};
    await feedbackService.submitRating(orderId, { rating, comment });
    res.status(201).json({ ok: true });
  }),

  submitComplaint: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { content } = req.body || {};
    await feedbackService.submitComplaint(orderId, { content });
    res.status(201).json({ ok: true });
  }),

  getRatingsAdmin: asyncHandler(async (req, res) => {
    const list = await feedbackService.listRatingsAdmin();
    res.json(list);
  }),

  getComplaintsAdmin: asyncHandler(async (req, res) => {
    const list = await feedbackService.listComplaintsAdmin();
    res.json(list);
  }),

  resolveComplaintAdmin: asyncHandler(async (req, res) => {
    const { note } = req.body || {};
    const { id } = req.params;
    const updated = await feedbackService.resolveComplaintAdmin(id, { note });
    res.json({ complaint: updated });
  }),
};

module.exports = feedbackController;

