import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardList, Phone, CreditCard } from 'lucide-react'
import { ordersApi, callsApi } from '../../api/client'
import type { Order } from '../../types'

const statusLabel: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chế biến',
  ready: 'Sẵn sàng',
  served: 'Đã phục vụ',
  cancelled: 'Đã hủy',
}

export default function OrderStatusPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [callSent, setCallSent] = useState<'staff' | 'payment' | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null)
  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status !== 'cancelled' && order.paymentStatus !== 'paid'),
    [orders]
  )
  const loadOrders = () => {
    if (!tableId) return Promise.resolve()
    return ordersApi
      .byTable(tableId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  const history = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number }>()
    visibleOrders.forEach((order) => {
      order.items.forEach((oi, idx) => {
        const mi = oi.menuItem
        const id =
          typeof mi === 'object' && mi && '_id' in mi
            ? mi._id
            : `${order._id}-${idx}`
        const name =
          typeof mi === 'object' && mi && 'name' in mi
            ? mi.name
            : `Món #${idx + 1}`
        const current = map.get(id)
        if (current) {
          current.quantity += oi.quantity
        } else {
          map.set(id, { name, quantity: oi.quantity })
        }
      })
    })
    return Array.from(map.entries()).map(([id, value]) => ({ id, ...value }))
  }, [visibleOrders])

  useEffect(() => {
    setLoading(true)
  }, [tableId])

  useEffect(() => {
    loadOrders()
  }, [tableId])


  const handleCall = async (type: 'staff' | 'payment') => {
    if (!tableId) return
    try {
      await callsApi.create(tableId, type)
      setCallSent(type)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gửi yêu cầu thất bại')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingOrderId(orderId)
    try {
      try {
        await ordersApi.delete(orderId)
      } catch {
        // Fallback for cases where backend route DELETE /orders/:id is not reloaded yet.
        await ordersApi.updateStatus(orderId, 'cancelled')
      }
      if (tableId) {
        const refreshed = await ordersApi.byTable(tableId)
        setOrders(refreshed)
      }
      setConfirmDeleteOrderId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xóa đơn thất bại')
    } finally {
      setDeletingOrderId(null)
    }
  }


  if (!tableId) return null
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mb-3 opacity-50" />
          <p>Chưa có đơn hàng nào.</p>
          <button
            type="button"
            onClick={() => navigate(`/table/${tableId}`)}
            className="btn-primary mt-4"
          >
            Xem menu
          </button>
        </div>
      ) : (
        <>
          {visibleOrders.map((order) => (
            <div key={order._id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-gray-400 text-sm">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </span>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    order.status === 'confirmed'
                      ? 'bg-green-500/20 text-green-400'
                      : order.status === 'cancelled'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-brand-500/20 text-brand-400'
                  }`}
                >
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
              <ul className="space-y-2">
                {order.items.map((oi, idx) => {
                  const name =
                    typeof oi.menuItem === 'object' && oi.menuItem && 'name' in oi.menuItem
                      ? oi.menuItem.name
                      : `Món #${idx + 1}`
                  return (
                    <li key={idx} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          {name} × {oi.quantity}
                        </span>
                      </div>
                      {oi.note && (
                        <p className="mt-1 text-xs text-gray-500 italic">
                          Ghi chú: {oi.note}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
              {order.totalAmount != null && (
                <p className="mt-3 pt-3 border-t border-gray-700 text-brand-400 font-medium">
                  Tổng: {order.totalAmount.toLocaleString('vi-VN')}₫
                </p>
              )}

              {order.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOrderId(order._id)}
                  disabled={deletingOrderId === order._id}
                  className="mt-3 w-full py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deletingOrderId === order._id ? 'Đang xóa...' : 'Xóa đơn hàng'}
                </button>
              )}

            </div>
          ))}

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

          {history.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-medium text-white mb-3">
                Lịch sử món đã gọi
              </p>
              <ul className="space-y-1 text-sm">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex justify-between text-gray-300"
                  >
                    <span>{h.name}</span>
                    <span className="text-brand-400 font-medium">
                      {h.quantity} lần
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {confirmDeleteOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận xóa đơn</h3>
            <p className="text-sm text-gray-300">Bạn có chắc muốn xóa đơn hàng này không?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOrderId(null)}
                disabled={deletingOrderId === confirmDeleteOrderId}
                className="flex-1 py-2 rounded-lg bg-surface-elevated text-gray-200 hover:bg-gray-600 disabled:opacity-50"
              >
                Không
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(confirmDeleteOrderId)}
                disabled={deletingOrderId === confirmDeleteOrderId}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50"
              >
                {deletingOrderId === confirmDeleteOrderId ? 'Đang xóa...' : 'Có, xóa đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
