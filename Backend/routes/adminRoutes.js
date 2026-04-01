/**
 * API quản trị (/api/admin/...), xử lý bởi Node + Express.
 * Từng nhóm route tương ứng màn hình admin: categories/menu/tables/users/orders/stats/payment-methods/ratings.
 */
const express = require('express');
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');
const paymentMethodController = require('../controllers/paymentMethodController');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Upload ảnh (trước các route /menu để tránh conflict)
router.post('/upload', upload.single('image'), adminController.uploadImage);

// Menu
// Luong cho man hinh AdminMenu:
// GET    /menu        -> lay danh sach mon
// POST   /menu        -> tao mon moi
// PATCH  /menu/:id    -> cap nhat mon
// DELETE /menu/:id    -> xoa mon
router.get('/menu', adminController.getMenu);
router.post('/menu', adminController.createMenuItem);
router.patch('/menu/:id', adminController.updateMenuItem);
router.delete('/menu/:id', adminController.deleteMenuItem);

// Tables
// Luong cho man hinh AdminTables:
// GET    /tables           -> lay danh sach ban
// POST   /tables           -> tao ban moi
// PUT/PATCH /tables/:id    -> cap nhat thong tin ban
// DELETE /tables/:id       -> xoa ban
router.get('/tables', adminController.getTables);
router.post('/tables', adminController.createTable);
// Back-Ends compatibility alias
router.put('/tables/:id', adminController.updateTable);
router.patch('/tables/:id', adminController.updateTable);
router.patch('/tables/:id/status', adminController.updateTable);
router.delete('/tables/:id', adminController.deleteTable);

// Users
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Orders (quản lý đơn hàng)
// Luong cho man hinh AdminOrders:
// GET   /orders             -> danh sach don (co the loc theo query)
// GET   /orders/:id         -> chi tiet 1 don
// PATCH /orders/:id/status  -> cap nhat trang thai don
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Thong ke (AdminStats): GET /stats -> tong hop tu bang Order + MenuItem
router.get('/stats', adminController.getStats);

// Payment methods (cash, card, ...)
router.get('/payment-methods', paymentMethodController.list);
router.post('/payment-methods', paymentMethodController.create);
router.put('/payment-methods/:id', paymentMethodController.update);
router.patch('/payment-methods/:id', paymentMethodController.patchActive);

// Customer feedback (ratings)
router.get('/ratings', feedbackController.getRatingsAdmin);
router.delete('/ratings/:id', feedbackController.deleteRatingAdmin);

module.exports = router;
