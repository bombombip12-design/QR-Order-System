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
router.get('/menu', adminController.getMenu);
router.post('/menu', adminController.createMenuItem);
router.patch('/menu/:id', adminController.updateMenuItem);
router.delete('/menu/:id', adminController.deleteMenuItem);

// Tables
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
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Stats
router.get('/stats', adminController.getStats);

// Payment methods (cash, card, ...)
router.get('/payment-methods', paymentMethodController.list);
router.post('/payment-methods', paymentMethodController.create);
router.put('/payment-methods/:id', paymentMethodController.update);
router.patch('/payment-methods/:id', paymentMethodController.patchActive);

// Customer feedback (ratings & complaints)
router.get('/ratings', feedbackController.getRatingsAdmin);
router.get('/complaints', feedbackController.getComplaintsAdmin);
router.patch('/complaints/:id/resolve', feedbackController.resolveComplaintAdmin);

module.exports = router;
