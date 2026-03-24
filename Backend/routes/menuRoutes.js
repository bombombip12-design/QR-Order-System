const express = require("express");
const menuController = require("../controllers/menuController");

const router = express.Router();

router.get("/categories", menuController.getCategories);
router.get("/dishes", menuController.getDishes);
router.get("/dishes/:id", menuController.getDishById);
router.get("/payment-methods", menuController.getPaymentMethods);

module.exports = router;
