const express = require('express');
const Category = require("../Models/Category");
const MenuItem = require("../Models/MenuItem");
const Table = require("../Models/tableModel");
const Order = require("../Models/Order");
const Call = require("../Models/Call");
const Payment = require("../Models/paymentModel");
const PaymentMethod = require("../Models/PaymentMethod");
const feedbackController = require('../controllers/feedbackController');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const paymentInstructions = {
  momo: {
    qrImageUrl: process.env.PAYMENT_MOMO_QR || '',
    accountName: process.env.PAYMENT_MOMO_NAME || '',
    accountNumber: process.env.PAYMENT_MOMO_PHONE || '',
  },
  bank: {
    bankName: process.env.PAYMENT_BANK_NAME || '',
    accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME || '',
    accountNumber: process.env.PAYMENT_BANK_ACCOUNT_NUMBER || '',
  },
};

async function resolveTableRef(tableParam) {
  if (tableParam === undefined || tableParam === null || tableParam === '') return null
  const raw = String(tableParam)

  if (mongoose.Types.ObjectId.isValid(raw)) return raw

  // Compatibility: accept numeric "1" from QR/old frontends
  const maybeNum = Number(raw)
  if (Number.isFinite(maybeNum) && !Number.isNaN(maybeNum)) {
    const t = await Table.findOne({ tableNumber: maybeNum }).lean()
    if (t?._id) return String(t._id)
  }

  // Compatibility: accept qrCode or name
  const t2 = await Table.findOne({ $or: [{ qrCode: raw }, { name: raw }] }).lean()
  if (t2?._id) return String(t2._id)

  const t3 = await Table.findOne({ code: raw.toUpperCase() }).lean()
  if (t3?._id) return String(t3._id)

  return null
}

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/payment-instructions', (req, res) => {
  res.json(paymentInstructions);
});

// Categories (public)
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ categories });
}));

// Menu (public)
router.get('/menu', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = {};
  if (category) filter.category = category;
  const items = await MenuItem.find(filter).populate('category').sort({ createdAt: -1 });
  res.json({ items });
}));

router.get('/menu/:id', asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('category');
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
}));

// Tables (public)
router.get('/tables', asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ tableNumber: 1 });
  res.json({ tables });
}));

/** Tra cứu bàn theo mã T1, T2… (dùng cho link /order/T1) */
router.get('/tables/by-code/:code', asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const table = await Table.findOne({ code }).lean();
  if (!table) return res.status(404).json({ message: 'Table not found' });
  res.json(table);
}));

router.get('/tables/:id', asyncHandler(async (req, res) => {
  const id = req.params.id
  if (mongoose.Types.ObjectId.isValid(String(id))) {
    const table = await Table.findById(id)
    if (!table) return res.status(404).json({ message: 'Table not found' })
    return res.json(table)
  }

  const table = await Table.findOne({
    $or: [
      { tableNumber: Number(id) },
      { qrCode: id },
      { name: id },
      { code: String(id).toUpperCase() },
    ],
  })
  if (!table) return res.status(404).json({ message: 'Table not found' });
  res.json(table);
}));

router.patch('/tables/:id', asyncHandler(async (req, res) => {
  const { status, currentGuests } = req.body || {};
  const allowedStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_service'];
  const update = {};

  if (status !== undefined) {
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid table status' });
    update.status = status;
  }
  if (currentGuests !== undefined) {
    const n = Number(currentGuests);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: 'Invalid currentGuests' });
    update.currentGuests = Math.floor(n);
  }

  const table = await Table.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!table) return res.status(404).json({ message: 'Table not found' });
  res.json({ table });
}));

// Orders (public)
router.get('/orders', asyncHandler(async (req, res) => {
  const { table, status } = req.query;
  const filter = {};
  if (table) {
    const resolved = await resolveTableRef(table)
    if (resolved) {
      filter.table = resolved
    } else {
      // If caller explicitly requests a table that can't be resolved,
      // do not return all orders.
      return res.json(status ? [] : { orders: [] })
    }
  }

  // status query is used by some frontends (cashier/admin)
  // We keep internal DB statuses for the existing TS screens.
  if (status) {
    if (status === 'paid') filter.paymentStatus = 'paid';
    else if (['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) filter.status = status;
  }

  const orders = await Order.find(filter)
    .populate('table')
    .populate('items.menuItem')
    .sort({ createdAt: -1 });

  const mapped = orders.map((o) => {
    const obj = o.toObject ? o.toObject() : o;
    obj.id = String(obj._id);
    obj.tableId = obj.table?._id ? String(obj.table._id) : obj.tableId;
    if (status === 'paid' && obj.paymentStatus === 'paid') obj.status = 'paid';
    if (obj.status === 'pending' && obj.confirmedAt) obj.status = 'confirmed';
    return obj;
  });

  // Compatibility: if caller provides `status` then some frontends expect raw array
  if (status) return res.json(mapped);
  return res.json({ orders: mapped });
}));

// Back-Ends compatible secured history endpoint (staff/admin/kitchen)
router.get('/orders/history', requireAuth, requireRole(['admin', 'staff', 'kitchen']), asyncHandler(async (req, res) => {
  const { status } = req.query;
  const paymentFilter = status === 'paid' || !status
    ? { status: { $in: ['paid', 'completed'] } }
    : { status: { $in: ['paid', 'completed'] } };

  const payments = await Payment.find(paymentFilter)
    .sort({ createdAt: -1 })
    .lean();

  const orderIds = [...new Set(payments.map((p) => String(p.order)))];
  const orders = await Order.find({ _id: { $in: orderIds } })
    .populate('table')
    .populate('items.menuItem')
    .lean();

  const paidAtByOrderId = new Map(payments.map((p) => [String(p.order), p.createdAt || p.updatedAt]));
  const paymentMethodByOrderId = new Map(payments.map((p) => [String(p.order), p.method || 'cash']));

  const mapped = orders
    .map((o) => {
      const paidAt = paidAtByOrderId.get(String(o._id));
      const paymentMethod = paymentMethodByOrderId.get(String(o._id));
      return {
        ...o,
        id: String(o._id),
        tableId: o.table?._id ? String(o.table._id) : undefined,
        paidAt,
        paymentMethod,
        status: 'paid',
        items: (o.items || []).map((it) => ({
          ...it,
          name: it.menuItem?.name,
          price: it.menuItem?.price,
        })),
      };
    })
    .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0));

  res.json(mapped);
}));

router.post('/orders', asyncHandler(async (req, res) => {
  const { table, tableId, items, note } = req.body || {};
  const resolvedTable = table || tableId;
  if (!resolvedTable || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Table and items are required' });
  }
  const resolvedTableRef = await resolveTableRef(resolvedTable)
  if (!resolvedTableRef) {
    return res.status(400).json({ message: 'Table not found' })
  }
  let totalAmount = 0;
  const mappedItems = [];
  for (const it of items) {
    const menuItemId = it.menuItem || it.menuItemId || it.dishId || it.dish || it.itemId;
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) continue;
    const lineTotal = menuItem.price * (it.quantity || 1);
    totalAmount += lineTotal;
    mappedItems.push({
      menuItem: menuItem._id,
      quantity: it.quantity || 1,
      note: it.note ?? note,
    });
  }
  const order = await Order.create({ table: resolvedTableRef, items: mappedItems, totalAmount });
  const populated = await order.populate(['table', 'items.menuItem']);
  res.status(201).json({ order: populated, id: order._id });
}));

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status: externalStatus } = req.body || {};
  const allowedInternal = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
  const map = {
    // Some frontends may send `paid` here; we map it to `served` and rely on paymentStatus
    paid: 'served',
  };

  const internalStatus = map[externalStatus] || externalStatus;
  if (!allowedInternal.includes(internalStatus)) return res.status(400).json({ message: 'Invalid status' });

  const update = { status: internalStatus };
  if (internalStatus === 'served') update.servedAt = new Date();
  if (internalStatus === 'cancelled') update.paymentStatus = 'cancelled';
  if (externalStatus === 'paid') update.paymentStatus = 'paid';
  if (externalStatus === 'confirmed') update.confirmedAt = new Date();

  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate(['table', 'items.menuItem']);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const obj = order.toObject ? order.toObject() : order;
  obj.id = String(obj._id);
  if (externalStatus === 'confirmed') obj.status = 'confirmed';
  if (externalStatus === 'paid' && obj.paymentStatus === 'paid') obj.status = 'paid';

  res.json({ order: obj });
}));

router.patch('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Paid order cannot be edited' });

  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items are required' });
  }

  let totalAmount = 0;
  const mappedItems = [];
  for (const it of items) {
    const menuItemId = it.menuItem || it.menuItemId || it.dishId || it.dish || it.itemId;
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) continue;
    const qty = Number(it.quantity || 1);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    totalAmount += menuItem.price * qty;
    mappedItems.push({
      menuItem: menuItem._id,
      quantity: qty,
      note: it.note ?? '',
    });
  }

  if (mappedItems.length === 0) {
    return res.status(400).json({ message: 'No valid items to update' });
  }

  order.items = mappedItems;
  order.totalAmount = totalAmount;
  await order.save();
  const populated = await order.populate(['table', 'items.menuItem']);
  return res.json({ order: populated });
}));

router.patch('/orders/:id/payment-request', asyncHandler(async (req, res) => {
  const { method } = req.body || {};
  const normalizedMethod = method === 'bank_transfer' || method === 'momo' || method === 'cash'
    ? method
    : 'cash';
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: 'requested', paymentMethod: normalizedMethod },
    { new: true }
  ).populate(['table', 'items.menuItem']);

  if (!order) return res.status(404).json({ message: 'Order not found' });
  return res.json({ order });
}));

router.delete('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id).lean();
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Remove related payment records so deleted orders do not remain in history screens.
  await Payment.deleteMany({ order: req.params.id });

  return res.status(204).end();
}));

router.patch('/orders/:id/payment', asyncHandler(async (req, res) => {
  const { method } = req.body || {};

  let paymentMethodName = 'cash';
  if (method) {
    // Some frontends pass paymentMethodId; others pass a string like 'cash'
    const maybeMethodDoc = await PaymentMethod.findById(method).lean().catch(() => null);
    if (maybeMethodDoc?.name) paymentMethodName = maybeMethodDoc.name;
    else paymentMethodName = String(method);
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: 'paid', paymentMethod: paymentMethodName },
    { new: true }
  ).populate(['table', 'items.menuItem']);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Once staff confirms payment, settle all active orders on the same table
  // so customer screens clear all current orders for that table.
  if (order.table?._id || order.table) {
    await Order.updateMany(
      {
        table: order.table?._id || order.table,
        status: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'paid' },
      },
      { $set: { paymentStatus: 'paid', paymentMethod: paymentMethodName } }
    );
  }

  if (order.totalAmount && order.totalAmount > 0) {
    const existingPaidPayment = await Payment.findOne({
      order: order._id,
      status: { $in: ['paid', 'completed'] },
    });
    if (existingPaidPayment) {
      await Payment.findByIdAndUpdate(existingPaidPayment._id, {
        amount: order.totalAmount,
        method: paymentMethodName,
        status: 'paid',
      });
    } else {
      await Payment.create({
        order: order._id,
        amount: order.totalAmount,
        method: paymentMethodName,
        status: 'paid',
      });
    }
  }
  res.json({ order });
}));

router.patch('/orders/:id/payment-method', asyncHandler(async (req, res) => {
  const { method } = req.body || {};
  if (!method) return res.status(400).json({ message: 'Payment method is required' });

  let paymentMethodName = 'cash';
  const maybeMethodDoc = await PaymentMethod.findById(method).lean().catch(() => null);
  if (maybeMethodDoc?.name) paymentMethodName = maybeMethodDoc.name;
  else paymentMethodName = String(method);

  const allowedMethods = ['cash', 'momo', 'bank_transfer'];
  if (!allowedMethods.includes(paymentMethodName)) {
    return res.status(400).json({ message: 'Invalid payment method' });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentMethod: paymentMethodName },
    { new: true }
  ).populate(['table', 'items.menuItem']);

  if (!order) return res.status(404).json({ message: 'Order not found' });

  await Payment.updateMany(
    { order: order._id, status: { $in: ['paid', 'completed'] } },
    { $set: { method: paymentMethodName } }
  );

  res.json({ order });
}));

// Compatibility alias used by some cashier frontends
router.post('/orders/:id/pay', asyncHandler(async (req, res) => {
  const { method } = req.body || {};
  // Reuse the same logic as PATCH /orders/:id/payment
  // (duplicated code for simplicity in this repo)
  let paymentMethodName = 'cash';
  if (method) {
    const maybeMethodDoc = await PaymentMethod.findById(method).lean().catch(() => null);
    if (maybeMethodDoc?.name) paymentMethodName = maybeMethodDoc.name;
    else paymentMethodName = String(method);
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: 'paid', paymentMethod: paymentMethodName },
    { new: true }
  ).populate(['table', 'items.menuItem']);

  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.table?._id || order.table) {
    await Order.updateMany(
      {
        table: order.table?._id || order.table,
        status: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'paid' },
      },
      { $set: { paymentStatus: 'paid', paymentMethod: paymentMethodName } }
    );
  }

  if (order.totalAmount && order.totalAmount > 0) {
    const existingPaidPayment = await Payment.findOne({
      order: order._id,
      status: { $in: ['paid', 'completed'] },
    });
    if (existingPaidPayment) {
      await Payment.findByIdAndUpdate(existingPaidPayment._id, {
        amount: order.totalAmount,
        method: paymentMethodName,
        status: 'paid',
      });
    } else {
      await Payment.create({
        order: order._id,
        amount: order.totalAmount,
        method: paymentMethodName,
        status: 'paid',
      });
    }
  }

  res.json({ order });
}));

// Order details used by cashier/admin frontends
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table')
    .populate('items.menuItem')
    .lean();

  if (!order) return res.status(404).json({ message: 'Order not found' });

  const status = order.paymentStatus === 'paid' ? 'paid' : order.status;
  const transformed = {
    ...order,
    id: String(order._id),
    tableId: order.table?._id ? String(order.table._id) : undefined,
    status,
    items: (order.items || []).map((it) => ({
      ...it,
      name: it.menuItem?.name,
      price: it.menuItem?.price,
    })),
  };
  if (transformed.status === 'pending' && order.confirmedAt) transformed.status = 'confirmed';

  res.json(transformed);
}));

// Customer feedback (ratings)
router.post('/orders/:orderId/rating', feedbackController.submitRating);

// Calls (public)
router.post('/calls', asyncHandler(async (req, res) => {
  const { table, tableId, type } = req.body;
  const rawTable = table || tableId
  if (!rawTable || !type) return res.status(400).json({ message: 'Table and type are required' });
  const resolved = await resolveTableRef(rawTable)
  if (!resolved) return res.status(400).json({ message: 'Table not found' });
  const call = await Call.create({ table: resolved, type });
  const populated = await call.populate('table');
  res.status(201).json({ call: populated });
}));

router.get('/calls', asyncHandler(async (req, res) => {
  const { table } = req.query;
  const filter = {};
  if (table) filter.table = table;
  const calls = await Call.find(filter).populate('table').sort({ createdAt: -1 });
  res.json({ calls });
}));

router.patch('/calls/:id/handle', asyncHandler(async (req, res) => {
  const call = await Call.findByIdAndUpdate(
    req.params.id,
    { status: 'handled' },
    { new: true }
  ).populate('table');
  if (!call) return res.status(404).json({ message: 'Call not found' });
  res.json({ call });
}));

module.exports = router;
