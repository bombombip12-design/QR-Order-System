import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { ordersApi, paymentApi } from '../../api/client'

export default function StaffPendingPayments() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState(null)

  const load = () => {
    setLoading(true)
    ordersApi
      .listByStatus('served')
      .then((list) => setOrders((Array.isArray(list) ? list : []).filter((o) => o.paymentStatus !== 'paid')))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const confirm = async (order) => {
    setPayingId(order._id)
    try {
      await paymentApi.confirm(order._id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xác nhận thanh toán thất bại')
    } finally {
      setPayingId(null)
    }
  }

  const printInvoice = (order) => {
    const lines = order.items
      .map((it) => {
        const name = typeof it.menuItem === 'object' ? it.menuItem?.name : 'Món'
        return `${name} x${it.quantity}`
      })
      .join('\n')
    const popup = window.open('', '_blank')
    if (!popup) return
    popup.document.write(
      `<pre>HOA DON\nBan: ${typeof order.table === 'object' ? order.table?.name : order.table}\n\n${lines}\n\nTong: ${(order.totalAmount || 0).toLocaleString('vi-VN')} VND</pre>`,
    )
    popup.document.close()
    popup.print()
  }

  if (loading) return <div className="text-gray-400">Đang tải đơn cần thanh toán...</div>
  if (orders.length === 0) return <div className="card p-4 text-gray-400">Không có đơn cần thanh toán.</div>

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o._id} className="card p-4">
          <div className="flex justify-between mb-2">
            <p className="text-white font-medium">Bàn {typeof o.table === 'object' ? o.table?.name : o.table}</p>
            <p className="text-brand-400 font-semibold">{(o.totalAmount || 0).toLocaleString('vi-VN')}₫</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => confirm(o)}
              disabled={payingId === o._id}
              className="px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 text-sm"
            >
              <CreditCard className="w-4 h-4 inline mr-1" />
              {payingId === o._id ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
            </button>
            <button
              type="button"
              onClick={() => printInvoice(o)}
              className="px-3 py-2 rounded-lg bg-surface-elevated text-gray-200 text-sm"
            >
              Xuất hóa đơn
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

