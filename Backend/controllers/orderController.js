const orderService = require("../services/orderService");

async function createOrder(req, res) {
  try {
    const result = await orderService.createOrder(req.body || {});
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getOrdersByTable(req, res) {
  try {
    res.json(await orderService.getOrdersByTable(req.params.tableId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function listOrders(req, res) {
  try {
    res.json(await orderService.listOrders(req.query.status));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getHistory(_req, res) {
  try {
    res.json(await orderService.getHistory());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await orderService.findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Khong tim thay don hang." });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateStatus(req, res) {
  try {
    const result = await orderService.updateOrderStatus(req.params.id, req.body?.status);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.json(result.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function payOrder(req, res) {
  try {
    const result = await orderService.payOrder(req.params.id, req.body?.method);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.json({
      message: "Thanh toan thanh cong.",
      order: result.data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function submitRating(req, res) {
  try {
    const result = await orderService.submitRating(req.params.id, req.body || {});
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createOrder,
  getOrdersByTable,
  listOrders,
  getHistory,
  getOrderById,
  updateStatus,
  payOrder,
  submitRating,
};
