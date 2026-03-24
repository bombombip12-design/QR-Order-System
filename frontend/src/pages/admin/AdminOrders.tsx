import { useEffect, useState } from 'react'
import { Search, Eye, X } from 'lucide-react'
import { adminApi } from '../../api/client'
import type { Order, Table, OrderStatus } from '../../types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chế biến',
  ready: 'Sẵn sàng',
  served: 'Đã phục vụ',
  cancelled: 'Đã hủy',
}

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Chưa thanh toán',
  requested: 'Yêu cầu thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTable, setFilterTable] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadTables = () => {
    adminApi.tables.list().then(setTables).catch(() => setTables([]))
  }

  const loadOrders = () => {
    setLoading(true)
    adminApi.orders
      .list({
        ...(filterTable ? { table: filterTable } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterPayment ? { paymentStatus: filterPayment } : {}),
      })
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTables()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [filterTable, filterStatus, filterPayment])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    if (type === 'success') setTimeout(() => setMessage(null), 3000)
  }

  const getTableName = (order: Order) => {
    const t = order.table
    return typeof t === 'object' && t?.name ? t.name : (t as string) || '—'
  }

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await adminApi.orders.updateStatus(orderId, status)
      showMsg('success', 'Đã cập nhật trạng thái đơn hàng.')
      setDetailOrder((prev) => (prev?._id === orderId ? updated : prev))
      loadOrders()
    } catch (e) {
      showMsg('error', e instanceof Error ? e.message : 'Cập nhật thất bại.')
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Xác nhận hủy đơn hàng này?')) return
    try {
      await adminApi.orders.updateStatus(orderId, 'cancelled')
      showMsg('success', 'Đã hủy đơn hàng.')
      setDetailOrder(null)
      loadOrders()
    } catch (e) {
      showMsg('error', e instanceof Error ? e.message : 'Hủy đơn thất bại.')
    }
  }

  const printInvoice = (order: Order) => {
    const tableName = getTableName(order)
    const rows = (order.items || [])
      .map((item) => {
        const menuItem = typeof item.menuItem === 'object' ? item.menuItem : null
        const name = menuItem?.name ?? 'Món'
        const price = menuItem?.price ?? 0
        const qty = item.quantity || 0
        return `${name} x${qty} - ${(price * qty).toLocaleString('vi-VN')} VND`
      })
      .join('\n')
    const popup = window.open('', '_blank')
    if (!popup) return
    popup.document.write(
      `<pre>HOA DON THANH TOAN\nBan: ${tableName}\nThoi gian: ${order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}\n\n${rows}\n\nTong: ${(order.totalAmount ?? 0).toLocaleString('vi-VN')} VND</pre>`
    )
    popup.document.close()
    popup.print()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Quản lý đơn hàng</h2>

      {message && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Lọc */}
      <div className="card p-4">
        <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Lọc đơn hàng
        </p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Theo bàn</label>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-elevated border border-gray-600 text-white text-sm min-w-[120px]"
            >
              <option value="">Tất cả bàn</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>
                  Bàn {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Trạng thái đơn</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-elevated border border-gray-600 text-white text-sm min-w-[140px]"
            >
              <option value="">Tất cả trạng thái</option>
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Thanh toán</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-elevated border border-gray-600 text-white text-sm min-w-[140px]"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="p-3 font-medium">Thời gian</th>
                  <th className="p-3 font-medium">Bàn</th>
                  <th className="p-3 font-medium">Trạng thái</th>
                  <th className="p-3 font-medium">Thanh toán</th>
                  <th className="p-3 font-medium">Tổng tiền</th>
                  <th className="p-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="p-3 text-white text-sm">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="p-3 text-white">Bàn {getTableName(o)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                          o.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : o.status === 'served'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300 text-sm">
                      {PAYMENT_LABEL[o.paymentStatus ?? 'pending'] ?? o.paymentStatus}
                    </td>
                    <td className="p-3 text-brand-400 font-medium">
                      {(o.totalAmount ?? 0).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(o)}
                        className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white mr-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {o.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(o._id)}
                          className="p-2 rounded-lg bg-surface-elevated text-red-400 hover:bg-red-500/20"
                          title="Hủy đơn"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal chi tiết đơn */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="card max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Chi tiết đơn hàng</h3>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-gray-400 text-sm">
                Thời gian: {detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleString('vi-VN') : '—'}
              </p>
              <p className="text-white">
                Bàn: <span className="font-medium">{getTableName(detailOrder)}</span>
              </p>
              <p>
                Trạng thái:{' '}
                <span
                  className={`px-2 py-0.5 rounded text-sm ${
                    detailOrder.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-400'
                      : detailOrder.status === 'served'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {STATUS_LABEL[detailOrder.status] ?? detailOrder.status}
                </span>
              </p>
              <p className="text-gray-300 text-sm">
                Thanh toán: {PAYMENT_LABEL[detailOrder.paymentStatus ?? 'pending']}
              </p>
              <div>
                <p className="text-gray-400 text-sm mb-2">Món đã đặt:</p>
                <ul className="space-y-1">
                  {(detailOrder.items || []).map((item, idx) => {
                    const menuItem = typeof item.menuItem === 'object' ? item.menuItem : null
                    const name = menuItem?.name ?? 'Món'
                    const price = menuItem?.price ?? 0
                    return (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-white">
                          {name} x{item.quantity}
                          {item.note ? ` (${item.note})` : ''}
                        </span>
                        <span className="text-gray-400">
                          {(price * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <p className="text-brand-400 font-semibold pt-2 border-t border-gray-700">
                Tổng: {(detailOrder.totalAmount ?? 0).toLocaleString('vi-VN')}₫
              </p>

              {detailOrder.paymentStatus === 'paid' && (
                <button
                  type="button"
                  onClick={() => printInvoice(detailOrder)}
                  className="w-full py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40"
                >
                  Xuất hóa đơn
                </button>
              )}

              {detailOrder.status !== 'cancelled' && (
                <div className="pt-3 space-y-2">
                  <p className="text-sm text-gray-400">Cập nhật trạng thái:</p>
                  <div className="flex flex-wrap gap-2">
                    {detailOrder.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(detailOrder._id, 'preparing')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30"
                      >
                        Đang chế biến
                      </button>
                    )}
                    {detailOrder.status === 'preparing' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(detailOrder._id, 'ready')}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm"
                      >
                        Sẵn sàng
                      </button>
                    )}
                    {detailOrder.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(detailOrder._id, 'served')}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm"
                      >
                        Đã phục vụ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cancelOrder(detailOrder._id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm"
                    >
                      Hủy đơn
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
