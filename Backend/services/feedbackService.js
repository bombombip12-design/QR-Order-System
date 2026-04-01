const mongoose = require('mongoose');
const Rating = require('../Models/Rating');
const Order = require('../Models/Order');

const feedbackService = {
  async submitRating(orderId, { rating, comment }) {
    if (!orderId) throw Object.assign(new Error('Missing orderId'), { statusCode: 400 });
    const order = await Order.findById(orderId).lean();
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw Object.assign(new Error('Invalid rating'), { statusCode: 400 });
    }

    const created = await Rating.create({
      orderId,
      rating: r,
      comment: comment ? String(comment) : '',
    });

    return created;
  },

  async listRatingsAdmin() {
    const ratings = await Rating.find().sort({ createdAt: -1 }).lean();
    return ratings.map((r) => ({
      id: String(r._id),
      orderId: String(r.orderId),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  },

  async deleteRatingAdmin(id) {
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      throw Object.assign(new Error('Đánh giá không tồn tại'), { statusCode: 404 });
    }
    const deleted = await Rating.findByIdAndDelete(id);
    if (!deleted) {
      throw Object.assign(new Error('Đánh giá không tồn tại'), { statusCode: 404 });
    }
  },
};

module.exports = feedbackService;
