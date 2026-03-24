const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
{
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  note: {
    type: String
  },

  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "served"],
    default: "pending"
  }

},
{ timestamps: true }
);

module.exports = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);