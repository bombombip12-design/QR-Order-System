import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, Trash2, Phone, CreditCard } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { ordersApi, callsApi } from '../../api/client'

export default function CartPage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const { items, updateQuantity, updateNote, removeItem, totalAmount, totalItems, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [callSent, setCallSent] = useState(null)

  const handleOrder = async () => {
    if (!tableId || items.length === 0) return
    setSubmitting(true)
    try {
      await ordersApi.create(
        tableId,
        items.map((i) => ({
          menuItem: typeof i.menuItem === 'object' ? i.menuItem._id : i.menuItem,
          quantity: i.quantity,
          note: i.note,
        })),
      )
      clearCart()
      navigate(`/table/${tableId}/orders`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gửi đơn thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCall = async (type) => {
    if (!tableId) return
    try {
      await callsApi.create(tableId, type)
      setCallSent(type)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gửi yêu cầu thất bại')
    }
  }

  if (!tableId) return null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="mb-4">Giỏ hàng trống.</p>
        <button type="button" onClick={() => navigate(`/table/${tableId}`)} className="btn-primary">
          Xem menu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {items.map((item) => {
          const menuItem = typeof item.menuItem === 'object' ? item.menuItem : null
          if (!menuItem) return null
          const price = menuItem.price * item.quantity
          return (
            <li key={menuItem._id} className="card p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{menuItem.name}</p>
                  <p className="text-sm text-gray-400">
                    {menuItem.price.toLocaleString('vi-VN')}₫ × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(menuItem._id, item.quantity - 1)}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(menuItem._id, item.quantity + 1)}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-brand-400 font-medium w-24 text-right">{price.toLocaleString('vi-VN')}₫</span>
                <button
                  type="button"
                  onClick={() => removeItem(menuItem._id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={item.note || ''}
                onChange={(e) => updateNote(menuItem._id, e.target.value)}
                rows={2}
                placeholder="Ghi chú cho món này (ít cay, không hành, ...)"
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
              />
            </li>
          )
        })}
      </ul>

      <div className="card p-4 space-y-4">
        <div className="flex justify-between text-lg">
          <span className="text-gray-400">Tổng cộng</span>
          <span className="font-semibold text-white">{totalAmount.toLocaleString('vi-VN')}₫</span>
        </div>
        <button type="button" onClick={handleOrder} disabled={submitting} className="w-full btn-primary py-3">
          {submitting ? 'Đang gửi...' : `Gửi đơn (${totalItems} món)`}
        </button>
      </div>

      <div className="card p-4">
        <p className="text-sm text-gray-400 mb-3">Cần hỗ trợ?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleCall('staff')}
            disabled={callSent === 'staff'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-elevated hover:bg-gray-600 disabled:opacity-50"
          >
            <Phone className="w-5 h-5" />
            {callSent === 'staff' ? 'Đã gọi nhân viên' : 'Gọi nhân viên'}
          </button>
          <button
            type="button"
            onClick={() => handleCall('payment')}
            disabled={callSent === 'payment'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-elevated hover:bg-gray-600 disabled:opacity-50"
          >
            <CreditCard className="w-5 h-5" />
            {callSent === 'payment' ? 'Đã yêu cầu thanh toán' : 'Yêu cầu thanh toán'}
          </button>
        </div>
      </div>
    </div>
  )
}

