const Rating = require('../Models/Rating');
const Complaint = require('../Models/Complaint');
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

  async submitComplaint(orderId, { content }) {
    if (!orderId) throw Object.assign(new Error('Missing orderId'), { statusCode: 400 });
    const order = await Order.findById(orderId).lean();
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

    if (!content || !String(content).trim()) {
      throw Object.assign(new Error('Content is required'), { statusCode: 400 });
    }

    const created = await Complaint.create({
      orderId,
      content: String(content),
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

  async listComplaintsAdmin() {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
    return complaints.map((c) => ({
      id: String(c._id),
      orderId: String(c.orderId),
      content: c.content,
      resolved: !!c.resolved,
      note: c.note,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
    }));
  },

  async resolveComplaintAdmin(id, { note }) {
    const updated = await Complaint.findByIdAndUpdate(
      id,
      {
        resolved: true,
        note: note !== undefined ? String(note) : '',
        resolvedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!updated) throw Object.assign(new Error('Complaint not found'), { statusCode: 404 });
    return updated;
  },
};

module.exports = feedbackService;

