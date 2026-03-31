import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = useCallback((menuItem, quantity = 1, note) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItem._id,
      )

      if (existing) {
        return prev.map((i) =>
          (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItem._id
            ? { ...i, quantity: i.quantity + quantity, note: note ?? i.note }
            : i,
        )
      }

      return [...prev, { menuItem, quantity, note }]
    })
  }, [])

  const removeItem = useCallback((menuItemId) => {
    setItems((prev) =>
      prev.filter(
        (i) => (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) !== menuItemId,
      ),
    )
  }, [])

  const updateQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter((i) => (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) !== menuItemId),
      )
      return
    }

    setItems((prev) =>
      prev.map((i) =>
        (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItemId
          ? { ...i, quantity }
          : i,
      ),
    )
  }, [])

  const updateNote = useCallback((menuItemId, note) => {
    setItems((prev) =>
      prev.map((i) =>
        (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItemId
          ? { ...i, note }
          : i,
      ),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalAmount = items.reduce(
    (s, i) => s + (typeof i.menuItem === 'object' ? i.menuItem.price : 0) * i.quantity,
    0,
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNote,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

