const feedbackService = require('../services/feedbackService');
const asyncHandler = require('../utils/asyncHandler');

const feedbackController = {
  submitRating: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { rating, comment } = req.body || {};
    await feedbackService.submitRating(orderId, { rating, comment });
    res.status(201).json({ ok: true });
  }),

  getRatingsAdmin: asyncHandler(async (req, res) => {
    const list = await feedbackService.listRatingsAdmin();
    res.json(list);
  }),

  deleteRatingAdmin: asyncHandler(async (req, res) => {
    await feedbackService.deleteRatingAdmin(req.params.id);
    res.status(204).send();
  }),
};

module.exports = feedbackController;

