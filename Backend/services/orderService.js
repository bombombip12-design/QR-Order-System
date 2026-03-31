const mongoose = require("mongoose");
const Order = require("../Models/Order");
const Table = require("../Models/tableModel");
const MenuItem = require("../Models/MenuItem");
const Payment = require("../Models/paymentModel");
const { newOrderId, calculateOrderTotal } = require("../utils/orderUtils");

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "paid",
  "cancelled",
];

const PAYMENT_METHODS = [
  { id: "cash", active: true },
  { id: "online", active: true },
];

function findTableFilter(tableId) {
  const normalized = String(tableId).trim();
  if (/^\d+$/.test(normalized)) {
    return { $or: [{ tableNumber: Number(normalized) }, { code: `TABLE-${normalized}` }] };
  }
  if (mongoose.Types.ObjectId.isValid(normalized)) {
    return { _id: normalized };
  }
  return { code: normalized.toUpperCase() };
}

async function sanitizeOrderItems(items) {
  const normalizedItems = (items || []).filter(
    (item) => item && item.dishId && Number(item.quantity) > 0
  );

  const sanitized = [];
  for (const item of normalizedItems) {
    let menuItem = null;
    if (mongoose.Types.ObjectId.isValid(String(item.dishId))) {
      menuItem = await MenuItem.findById(item.dishId).lean();
    }
    if (!menuItem) {
      menuItem = await MenuItem.findOne({ legacyId: String(item.dishId) }).lean();
    }

    const unitPrice = Number(item.price ?? menuItem?.price ?? 0);
    const quantity = Number(item.quantity);
    sanitized.push({
      menuItem: menuItem?._id || null,
      legacyDishId: String(item.dishId),
      nameSnapshot: item.name || menuItem?.name || "Mon an",
      unitPriceSnapshot: unitPrice,
      quantity,
      note: item.note || "",
      lineTotal: unitPrice * quantity,
    });
  }

  return sanitized;
}

function toResponse(orderDoc) {
  return {
    id: String(orderDoc._id),
    tableId: orderDoc.table?.tableNumber ? String(orderDoc.table.tableNumber) : null,
    tableRef: orderDoc.table?._id ? String(orderDoc.table._id) : String(orderDoc.table),
    items: (orderDoc.items || []).map((item) => ({
      dishId: item.legacyDishId || (item.menuItem ? String(item.menuItem) : null),
      name: item.nameSnapshot,
      price: item.unitPriceSnapshot,
      quantity: item.quantity,
      note: item.note || "",
    })),
    note: orderDoc.note || "",
    status: orderDoc.status,
    totalAmount: orderDoc.totalAmount,
    payment: orderDoc.payment || { status: "unpaid", method: null, paidAt: null },
    createdAt: orderDoc.createdAt,
    updatedAt: orderDoc.updatedAt,
  };
}

async function createOrder({ tableId, items, note }) {
  if (!tableId) {
    return { error: { status: 400, message: "tableId la bat buoc." } };
  }

  const table = await Table.findOne(findTableFilter(tableId));
  if (!table) {
    return { error: { status: 404, message: "Ban khong ton tai." } };
  }

  const cleanItems = await sanitizeOrderItems(items);
  if (cleanItems.length === 0) {
    return { error: { status: 400, message: "Don hang phai co it nhat 1 mon." } };
  }

  const order = await Order.create({
    orderCode: newOrderId(),
    table: table._id,
    items: cleanItems,
    note: note || "",
    status: "pending",
    totalAmount: calculateOrderTotal(cleanItems),
    subtotal: calculateOrderTotal(cleanItems),
    paymentStatus: "unpaid",
    payment: { status: "unpaid", method: null, paidAt: null },
  });

  const saved = await Order.findById(order._id).populate("table").lean();
  return { data: toResponse(saved) };
}

async function getOrdersByTable(tableId) {
  const table = await Table.findOne(findTableFilter(tableId));
  if (!table) return [];

  const docs = await Order.find({ table: table._id }).populate("table").sort({ createdAt: -1 }).lean();
  return docs.map(toResponse);
}

async function listOrders(status) {
  const filter = status ? { status: String(status) } : {};
  const docs = await Order.find(filter).populate("table").sort({ createdAt: -1 }).lean();
  return docs.map(toResponse);
}

async function getHistory() {
  const docs = await Order.find({ status: { $in: ["served", "paid", "cancelled"] } })
    .populate("table")
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(toResponse);
}

async function findOrderById(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) return null;
  const order = await Order.findById(id).populate("table").lean();
  if (!order) return null;
  return toResponse(order);
}

async function updateOrderStatus(id, status) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    return { error: { status: 404, message: "Khong tim thay don hang." } };
  }
  const order = await Order.findById(id);
  if (!order) return { error: { status: 404, message: "Khong tim thay don hang." } };
  if (!ALLOWED_STATUSES.includes(status)) {
    return { error: { status: 400, message: "Trang thai khong hop le." } };
  }

  order.status = status;
  await order.save();
  const saved = await Order.findById(order._id).populate("table").lean();
  return { data: toResponse(saved) };
}

async function payOrder(id, method) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    return { error: { status: 404, message: "Khong tim thay don hang." } };
  }
  const order = await Order.findById(id);
  if (!order) return { error: { status: 404, message: "Khong tim thay don hang." } };

  const isValidMethod = PAYMENT_METHODS.some((m) => m.id === method && m.active === true);
  if (!isValidMethod) {
    return { error: { status: 400, message: "Phuong thuc thanh toan khong hop le." } };
  }

  const paidAt = new Date();
  order.status = "paid";
  order.paymentStatus = "paid";
  order.payment = {
    status: "paid",
    method,
    paidAt,
  };
  await order.save();

  await Payment.create({
    order: order._id,
    amount: order.totalAmount,
    method,
    status: "paid",
    paidAt,
  });

  const saved = await Order.findById(order._id).populate("table").lean();
  return { data: toResponse(saved) };
}

async function submitRating(orderId, body) {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    return { error: { status: 404, message: "Khong tim thay don hang." } };
  }
  const order = await Order.findById(orderId);
  if (!order) return { error: { status: 404, message: "Khong tim thay don hang." } };
  if (order.status !== "paid") {
    return { error: { status: 400, message: "Chi duoc danh gia sau khi da thanh toan don hang." } };
  }

  const rawScore = body?.score ?? body?.rating ?? body?.stars ?? body?.value;
  const normalizedScore = parseInt(rawScore, 10);
  if (Number.isNaN(normalizedScore) || normalizedScore < 1 || normalizedScore > 5) {
    return { error: { status: 400, message: "Diem danh gia phai tu 1 den 5." } };
  }

  const ratingRecord = {
    score: normalizedScore,
    comment: body?.comment || "",
    createdAt: new Date(),
  };

  order.customerFeedback = order.customerFeedback || {};
  order.customerFeedback.rating = ratingRecord;
  await order.save();

  return { data: ratingRecord };
}

module.exports = {
  createOrder,
  getOrdersByTable,
  listOrders,
  getHistory,
  findOrderById,
  updateOrderStatus,
  payOrder,
  submitRating,
};
