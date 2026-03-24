const tableService = require("../services/tableService");

async function callStaff(req, res) {
  try {
    const table = await tableService.callStaff(req.params.tableId);
    if (!table) {
      return res.status(404).json({ message: "Ban khong ton tai." });
    }

    return res.status(201).json({
      message: `Da gui yeu cau goi nhan vien cho ban ${table.tableNumber}.`,
      table,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  callStaff,
};
