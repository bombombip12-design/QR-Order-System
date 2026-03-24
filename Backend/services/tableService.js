const { Table, Call } = require("../models");

function findTableFilter(tableId) {
  const normalized = String(tableId).trim();
  if (/^\d+$/.test(normalized)) {
    return { $or: [{ tableNumber: Number(normalized) }, { code: `TABLE-${normalized}` }] };
  }
  return { $or: [{ _id: normalized }, { code: normalized.toUpperCase() }] };
}

async function callStaff(tableId) {
  const table = await Table.findOne(findTableFilter(tableId));
  if (!table) return null;

  const now = new Date();
  table.lastCallAt = now;
  table.callCount = (table.callCount || 0) + 1;
  await table.save();

  await Call.create({
    table: table._id,
    callType: "staff",
    status: "pending",
    requestedAt: now,
  });

  return {
    id: String(table._id),
    tableNumber: table.tableNumber,
    code: table.code,
    status: table.status,
    lastCallAt: table.lastCallAt,
    callCount: table.callCount,
  };
}

module.exports = {
  callStaff,
};
