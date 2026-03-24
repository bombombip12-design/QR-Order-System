const mongoose = require('mongoose');

// Embedded schema for order line items (used by POST /orders)
const OrderItemEmbeddedSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String },
    price: { type: Number },
    status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    items: { type: [OrderItemEmbeddedSchema], required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'requested', 'paid', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'momo', 'bank_transfer'],
      default: 'cash',
    },
    totalAmount: { type: Number, default: 0 },
    confirmedAt: { type: Date, default: null },
    servedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
