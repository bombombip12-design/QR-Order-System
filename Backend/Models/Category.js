const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  sortOrder: {
    type: Number,
    default: 0
  }

},
{ timestamps: true }
);

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
