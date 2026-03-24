import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { CartItem, MenuItem } from '../types'

type CartContextType = {
  items: CartItem[]
  addItem: (item: MenuItem, quantity?: number, note?: string) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateNote: (menuItemId: string, note: string) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((menuItem: MenuItem, quantity = 1, note?: string) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItem._id
      )
      if (existing) {
        return prev.map((i) =>
          (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItem._id
            ? { ...i, quantity: i.quantity + quantity, note: note ?? i.note }
            : i
        )
      }
      return [...prev, { menuItem, quantity, note }]
    })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) !== menuItemId))
  }, [])

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) !== menuItemId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItemId
          ? { ...i, quantity }
          : i
      )
    )
  }, [])

  const updateNote = useCallback((menuItemId: string, note: string) => {
    setItems((prev) =>
      prev.map((i) =>
        (typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem) === menuItemId
          ? { ...i, note }
          : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalAmount = items.reduce((s, i) => s + (typeof i.menuItem === 'object' ? i.menuItem.price : 0) * i.quantity, 0)

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
