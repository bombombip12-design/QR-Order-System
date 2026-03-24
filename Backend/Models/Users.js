const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String
  },

  role: {
    type: String,
    enum: ["manager", "staff", "kitchen"],
    default: "staff"
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

},
{ timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);