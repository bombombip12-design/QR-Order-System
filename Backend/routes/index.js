const express = require('express');
const apiRoutes = require('./apiRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const menuRoutes = require('./menuRoutes');
const tableRoutes = require('./tableRoutes');

const router = express.Router();

router.use('/', apiRoutes);
// Deep-merged Back-Ends style route/controller/service flow (non-overlapping endpoints only)
router.use('/', orderRoutes);
router.use('/', menuRoutes);
router.use('/', tableRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
