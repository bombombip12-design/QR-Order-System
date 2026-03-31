import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard } from 'lucide-react'
import { ordersApi, paymentApi, tablesApi } from '../../api/client'

const statusLabel = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chế biến',
  ready: 'Sẵn sàng',
  served: 'Đã phục vụ',
  cancelled: 'Đã hủy',
}

export default function StaffTableOrders() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!tableId) return Promise.resolve()
    return Promise.all([tablesApi.get(tableId), ordersApi.byTable(tableId)])
      .then(([t, ords]) => {
        setTable(t)
        setOrders((ords || []).filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid'))
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
  }, [tableId])

  useEffect(() => {
    load()
  }, [tableId])

  const refreshOrders = () => {
    if (!tableId) return
    ordersApi.byTable(tableId).then((ords) => setOrders((ords || []).filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid')))
  }

  const handleMarkServed = async (orderId) => {
    try {
      await ordersApi.updateStatus(orderId, 'served')
      refreshOrders()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cập nhật thất bại')
    }
  }

  const handleConfirmPayment = async (orderId) => {
    try {
      await paymentApi.confirm(orderId)
      refreshOrders()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xác nhận thanh toán thất bại')
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
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/staff')}
          className="p-2 rounded-lg bg-surface-card hover:bg-surface-elevated"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-white">Bàn {table?.name ?? tableId}</h2>
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">Chưa có đơn hàng nào tại bàn này.</div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    order.status === 'served'
                      ? 'bg-green-500/20 text-green-400'
                      : order.status === 'ready'
                        ? 'bg-brand-500/20 text-brand-400'
                        : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
              <ul className="space-y-2 mb-4">
                {order.items.map((oi, idx) => {
                  const name =
                    typeof oi.menuItem === 'object' && oi.menuItem && 'name' in oi.menuItem ? oi.menuItem.name : `Món #${idx + 1}`
                  return (
                    <li key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {name} × {oi.quantity}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {order.totalAmount != null && (
                <p className="text-brand-400 font-medium mb-3">Tổng: {order.totalAmount.toLocaleString('vi-VN')}₫</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {order.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => handleMarkServed(order._id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Đã phục vụ
                  </button>
                )}
                {order.status === 'served' && order.paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmPayment(order._id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    Xác nhận thanh toán
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

