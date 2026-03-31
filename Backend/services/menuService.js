const Category = require("../Models/Category");
const MenuItem = require("../Models/MenuItem");

async function getCategories() {
  const docs = await Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    image: doc.image || "",
  }));
}

async function getDishes(categoryId) {
  const filter = { isAvailable: true };
  if (categoryId) filter.category = categoryId;

  const docs = await MenuItem.find(filter).sort({ createdAt: -1 }).lean();
  return docs.map((doc) => ({
    id: String(doc._id),
    legacyId: doc.legacyId || null,
    categoryId: String(doc.category),
    name: doc.name,
    description: doc.description || "",
    image: doc.image || "",
    price: doc.price || 0,
    isAvailable: doc.isAvailable,
  }));
}

async function getDishById(id) {
  const doc = await MenuItem.findById(id).lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    legacyId: doc.legacyId || null,
    categoryId: String(doc.category),
    name: doc.name,
    description: doc.description || "",
    image: doc.image || "",
    price: doc.price || 0,
    isAvailable: doc.isAvailable,
  };
}

function getPaymentMethods() {
  return [
    { id: "cash", name: "Tien mat", active: true },
    { id: "online", name: "Thanh toan online", active: true },
  ];
}

module.exports = {
  getCategories,
  getDishes,
  getDishById,
  getPaymentMethods,
};
