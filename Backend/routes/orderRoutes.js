const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

// Keep only missing compatibility endpoints to avoid duplicate handlers with apiRoutes.
router.get("/orders/table/:tableId", orderController.getOrdersByTable);

module.exports = router;
