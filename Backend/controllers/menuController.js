const menuService = require("../services/menuService");

async function getCategories(_req, res) {
  try {
    res.json(await menuService.getCategories());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getDishes(req, res) {
  try {
    res.json(await menuService.getDishes(req.query.categoryId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getDishById(req, res) {
  try {
    const dish = await menuService.getDishById(req.params.id);
    if (!dish) {
      return res.status(404).json({ message: "Khong tim thay mon an." });
    }
    return res.json(dish);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

function getPaymentMethods(_req, res) {
  res.json(menuService.getPaymentMethods());
}

module.exports = {
  getCategories,
  getDishes,
  getDishById,
  getPaymentMethods,
};
