const PaymentMethod = require('../Models/PaymentMethod');

const normalize = (doc) => ({
  id: String(doc._id),
  name: doc.name,
  active: !!doc.active,
});

const paymentMethodService = {
  async list() {
    const methods = await PaymentMethod.find().sort({ createdAt: -1 }).lean();
    return methods.map(normalize);
  },

  async create({ name, active }) {
    const method = await PaymentMethod.create({
      name: String(name || '').trim(),
      active: active ?? true,
    });
    return normalize(method);
  },

  async update(id, { name, active }) {
    const updated = await PaymentMethod.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(active !== undefined ? { active: !!active } : {}),
      },
      { new: true }
    ).lean();

    if (!updated) throw Object.assign(new Error('Payment method not found'), { statusCode: 404 });
    return normalize(updated);
  },

  async patchActive(id, active) {
    return paymentMethodService.update(id, { active });
  },
};

module.exports = paymentMethodService;

