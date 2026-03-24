// Dùng chung cho frontend, map với MongoDB models

export interface Category {
  _id: string
  name: string
  description?: string
  sortOrder?: number
}

export interface MenuItem {
  _id: string
  name: string
  description?: string
  price: number
  image?: string
  category: string | Category
  available?: boolean
}

export interface Table {
  _id: string
  name: string
  /** Số bàn (1, 2, …) — dùng trong URL /table/1 */
  tableNumber?: number
  code?: string
  /** Link đặt món đầy đủ (nếu có thì QR dùng link này) */
  orderUrl?: string
  qrCode?: string
  /** Backend có thể trả `seats` thay cho capacity */
  capacity?: number
  seats?: number
  currentGuests?: number
  status?: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'out_of_service'
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentStatus = 'pending' | 'requested' | 'paid' | 'cancelled'

export interface OrderItem {
  _id?: string
  menuItem: string | MenuItem
  quantity: number
  note?: string
  status?: OrderStatus
}

export interface Order {
  _id: string
  table: string | Table
  items: OrderItem[]
  status: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: 'cash' | 'momo' | 'bank_transfer' | string
  totalAmount?: number
  createdAt: string
  updatedAt?: string
  servedAt?: string
}

export interface Call {
  _id: string
  table: string | Table
  type: 'staff' | 'payment'
  status: 'pending' | 'handled'
  createdAt: string
}

export interface PaymentMethod {
  id: string
  name: string
  active: boolean
}

export interface PaymentInstructions {
  momo: {
    qrImageUrl: string
    accountName: string
    accountNumber: string
  }
  bank: {
    bankName: string
    accountName: string
    accountNumber: string
  }
}

export interface Rating {
  id: string
  orderId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface Complaint {
  id: string
  orderId: string
  content: string
  resolved: boolean
  note?: string
  createdAt: string
  resolvedAt?: string
}

export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'waiter' | 'kitchen' | 'admin'
}

// Cart (client only)
export interface CartItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}
