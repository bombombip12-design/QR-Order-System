const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  price: {
    type: Number,
    required: true
  },

  image: {
    type: String
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  status: {
    type: String,
    enum: ["available", "unavailable"],
    default: "available"
  }

},
{ timestamps: true }
);

module.exports = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);