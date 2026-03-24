const express = require("express");
const { callStaff } = require("../controllers/tableController");

const router = express.Router();

router.post("/tables/:tableId/call-staff", callStaff);

module.exports = router;
