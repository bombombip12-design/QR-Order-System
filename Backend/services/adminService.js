const bcrypt = require("bcryptjs");
const Category = require("../Models/Category");
const MenuItem = require("../Models/MenuItem");
const Table = require("../Models/Table");
const User = require("../Models/User");
const Order = require("../Models/Order");

const adminService = {
  // --- Categories ---
  async getCategories() {
    return Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  },

  async createCategory(data) {
    return Category.create(data);
  },

  async updateCategory(id, data) {
    const category = await Category.findByIdAndUpdate(id, data, { new: true });
    if (!category) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
    return category;
  },

  async deleteCategory(id) {
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
    return deleted;
  },

  // --- Menu ---
  async getMenuItems() {
    return MenuItem.find().populate('category').sort({ createdAt: -1 }).lean();
  },

  async createMenuItem(data) {
    const item = await MenuItem.create(data);
    return item.populate('category');
  },

  async updateMenuItem(id, data) {
    const item = await MenuItem.findByIdAndUpdate(id, data, { new: true }).populate('category');
    if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
    return item;
  },

  async deleteMenuItem(id) {
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
    return deleted;
  },

  // --- Tables ---
  async getTables() {
    return Table.find().sort({ tableNumber: 1 }).lean();
  },

  async createTable(data) {
    const { name, capacity, orderUrl } = data || {};
    const maxDoc = await Table.findOne().sort({ tableNumber: -1 }).select("tableNumber").lean();
    const tableNumber = maxDoc && maxDoc.tableNumber ? maxDoc.tableNumber + 1 : 1;
    /** Giống mẫu DB: T1, T2, … (không dùng T001) */
    const code = `T${tableNumber}`;
    const urlStr = orderUrl != null ? String(orderUrl).trim() : "";
    const displayName = name != null && String(name).trim() ? String(name).trim() : `Bàn ${tableNumber}`;
    const seats =
      capacity != null && capacity !== ""
        ? Math.max(1, Number(capacity))
        : 4;

    const frontBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    /** Mặc định: link trỏ thẳng tới trang khách đặt món /table/1 (số bàn) */
    const finalOrderUrl = urlStr || `${frontBase}/table/${tableNumber}`;
    /** Mã QR nội dung = orderUrl; trường qrCode lưu nhãn dạng QR_T1 như mẫu */
    const qrLabel = `QR_${code}`;

    return Table.create({
      name: displayName,
      tableNumber,
      code,
      seats,
      orderUrl: finalOrderUrl,
      qrCode: qrLabel,
    });
  },

  async updateTable(id, data) {
    const patch = { ...(data || {}) };
    if (patch.capacity !== undefined) {
      patch.seats =
        patch.capacity === "" || patch.capacity == null
          ? undefined
          : Math.max(1, Number(patch.capacity));
      delete patch.capacity;
    }
    if (patch.orderUrl !== undefined) {
      patch.orderUrl = String(patch.orderUrl).trim();
      if (!patch.orderUrl) {
        const existing = await Table.findById(id).select("tableNumber").lean();
        const frontBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
        patch.orderUrl = existing?.tableNumber != null
          ? `${frontBase}/table/${existing.tableNumber}`
          : "";
      }
      /** Không ghi đè qrCode bằng URL — giữ kiểu QR_T1 như dữ liệu mẫu */
    }
    Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

    const table = await Table.findByIdAndUpdate(id, patch, { new: true });
    if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
    return table;
  },

  async deleteTable(id) {
    const deleted = await Table.findByIdAndDelete(id);
    if (!deleted) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
    return deleted;
  },

  // --- Users ---
  async getUsers() {
    return User.find().sort({ createdAt: -1 }).select('-password').lean();
  },

  async createUser(data) {
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ ...rest, password: hashedPassword });
    const u = user.toObject();
    delete u.password;
    return u;
  },

  async updateUser(id, data) {
    const updateData = { ...data };
    if (updateData.password !== undefined) delete updateData.password;
    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) throw Object.assign(new Error('Nhân viên không tồn tại'), { statusCode: 404 });
    return user;
  },

  async deleteUser(id) {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) throw Object.assign(new Error('Nhân viên không tồn tại'), { statusCode: 404 });
    return deleted;
  },

  // --- Orders (quản lý đơn hàng) ---
  async getOrders(filter = {}) {
    const q = {};
    if (filter.table) q.table = filter.table;
    if (filter.status) q.status = filter.status;
    if (filter.paymentStatus) q.paymentStatus = filter.paymentStatus;
    return Order.find(q)
      .populate('table')
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .lean();
  },

  async getOrderById(id) {
    const order = await Order.findById(id)
      .populate('table')
      .populate('items.menuItem')
      .lean();
    if (!order) throw Object.assign(new Error('Đơn hàng không tồn tại'), { statusCode: 404 });
    return order;
  },

  async updateOrderStatus(id, status) {
    const allowed = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!allowed.includes(status)) {
      throw Object.assign(new Error('Trạng thái không hợp lệ'), { statusCode: 400 });
    }
    const update = { status };
    if (status === 'served') update.servedAt = new Date();
    if (status === 'cancelled') update.paymentStatus = 'cancelled';
    const order = await Order.findByIdAndUpdate(id, update, { new: true })
      .populate('table')
      .populate('items.menuItem');
    if (!order) throw Object.assign(new Error('Đơn hàng không tồn tại'), { statusCode: 404 });
    return order;
  },

  // --- Stats ---
  async getStats() {
    const orders = await Order.find().lean();
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;

    const itemCountMap = new Map();
    orders.forEach((o) => {
      (o.items || []).forEach((oi) => {
        const id = String(oi.menuItem);
        const qty = oi.quantity || 0;
        const current = itemCountMap.get(id) || { id, quantity: 0 };
        current.quantity += qty;
        itemCountMap.set(id, current);
      });
    });

    const allMenu = await MenuItem.find().lean();
    const menuMap = new Map(allMenu.map((m) => [String(m._id), m.name]));

    const topItems = Array.from(itemCountMap.values())
      .map((item) => ({
        name: menuMap.get(item.id) || 'Món chưa rõ',
        quantity: item.quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { revenue, totalOrders, topItems };
  },
};

module.exports = adminService;
