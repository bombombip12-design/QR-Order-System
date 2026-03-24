const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
{
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true
  },

  type: {
    type: String,
    enum: ["staff", "payment", "call_staff", "request_bill"],
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "handled", "done"],
    default: "pending"
  }

},
{ timestamps: true }
);

module.exports = mongoose.models.Call || mongoose.model("Call", callSchema);