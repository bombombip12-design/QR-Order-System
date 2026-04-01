const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');

// --- Categories ---
const getCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getCategories();
  res.json({ categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);
  res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await adminService.updateCategory(req.params.id, req.body);
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await adminService.deleteCategory(req.params.id);
  res.status(204).end();
});

// --- Menu ---
const getMenu = asyncHandler(async (req, res) => {
  // Route GET /api/admin/menu -> lay danh sach mon cho trang admin.
  const items = await adminService.getMenuItems();
  res.json({ items });
});

const createMenuItem = asyncHandler(async (req, res) => {
  // Route POST /api/admin/menu -> tao mon moi tu du lieu form.
  const item = await adminService.createMenuItem(req.body);
  res.status(201).json({ item });
});

const updateMenuItem = asyncHandler(async (req, res) => {
  // Route PATCH /api/admin/menu/:id -> cap nhat mon theo id.
  const item = await adminService.updateMenuItem(req.params.id, req.body);
  res.json({ item });
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  // Route DELETE /api/admin/menu/:id -> xoa mon theo id.
  await adminService.deleteMenuItem(req.params.id);
  res.status(204).end();
});

// --- Tables ---
const getTables = asyncHandler(async (req, res) => {
  // Route GET /api/admin/tables -> goi service lay danh sach ban tu DB.
  const tables = await adminService.getTables();
  res.json({ tables });
});

const createTable = asyncHandler(async (req, res) => {
  // Route POST /api/admin/tables -> tao ban moi theo payload tu form admin.
  const table = await adminService.createTable(req.body);
  res.status(201).json({ table });
});

const updateTable = asyncHandler(async (req, res) => {
  // Route PATCH/PUT /api/admin/tables/:id -> cap nhat thong tin 1 ban.
  const table = await adminService.updateTable(req.params.id, req.body);
  res.json({ table });
});

const deleteTable = asyncHandler(async (req, res) => {
  // Route DELETE /api/admin/tables/:id -> xoa 1 ban theo id.
  await adminService.deleteTable(req.params.id);
  res.status(204).end();
});

// --- Users ---
const getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers();
  res.json({ users });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập họ tên.' });
  }
  if (!email || !String(email).trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' });
  }
  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại.' });
  }
  const phoneDigits = String(phone).replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return res.status(400).json({ message: 'Số điện thoại phải có đủ 10 số.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }
  if (!role || !['waiter', 'kitchen', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Vui lòng chọn vai trò.' });
  }
  const user = await adminService.createUser({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phoneDigits,
    password: String(password),
    role,
  });
  res.status(201).json({ user });
});

const updateUser = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length !== 10) {
      return res.status(400).json({ message: 'Số điện thoại phải có đủ 10 số.' });
    }
    req.body.phone = digits;
  }
  const user = await adminService.updateUser(req.params.id, req.body);
  res.json({ user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  res.status(204).end();
});

// --- Orders (quản lý đơn hàng) ---
const getOrders = asyncHandler(async (req, res) => {
  // Route GET /api/admin/orders:
  // nhan cac query filter tu frontend (table/status/paymentStatus) roi chuyen cho service.
  const { table, status, paymentStatus } = req.query;
  const filter = {};
  if (table) filter.table = table;
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  const orders = await adminService.getOrders(filter);
  res.json({ orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  // Route GET /api/admin/orders/:id -> lay chi tiet 1 don phuc vu popup "Xem".
  const order = await adminService.getOrderById(req.params.id);
  res.json({ order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  // Route PATCH /api/admin/orders/:id/status -> cap nhat trang thai nghiep vu cua don.
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Thiếu trạng thái' });
  const order = await adminService.updateOrderStatus(req.params.id, status);
  res.json({ order });
});

// --- Stats ---
const getStats = asyncHandler(async (req, res) => {
  // Route GET /api/admin/stats -> tra JSON { revenue, totalOrders, topItems }.
  const stats = await adminService.getStats();
  res.json(stats);
});

// --- Upload ảnh món ăn ---
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Chưa chọn ảnh' });
  }
  const url = `/uploads/menu/${req.file.filename}`;
  res.status(201).json({ url });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getStats,
  uploadImage,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
