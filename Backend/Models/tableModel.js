const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    /** Tên hiển thị (vd: Bàn 1, A1) */
    name: { type: String, default: "", trim: true },
    /** Link đặt món đầy đủ khách dán vào (ưu tiên dùng cho QR / xem trước) */
    orderUrl: { type: String, default: "", trim: true },
    tableNumber: { type: Number, required: true, unique: true, min: 1 },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    qrCode: { type: String, default: "" },
    seats: { type: Number, default: 4, min: 1 },
    currentGuests: { type: Number, default: 0, min: 0 },
    area: { type: String, default: "main", trim: true },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning", "out_of_service"],
      default: "available",
    },
    lastCallAt: { type: Date, default: null },
    callCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Table || mongoose.model("Table", tableSchema, "tables");
