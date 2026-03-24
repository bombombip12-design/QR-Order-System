function newOrderId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function calculateOrderTotal(items) {
  return (items || []).reduce((sum, item) => {
    const lineTotal =
      item?.lineTotal !== undefined && item?.lineTotal !== null
        ? Number(item.lineTotal)
        : Number(item?.unitPriceSnapshot ?? item?.price ?? 0) * Number(item?.quantity ?? 0);

    return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);
}

module.exports = {
  newOrderId,
  calculateOrderTotal,
};
