import { useEffect, useState } from 'react'
import { Search, Eye, X } from 'lucide-react'
import { adminApi } from '../../api/client'

const STATUS_LABEL = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chế biến',
  ready: 'Sẵn sàng',
  served: 'Đã phục vụ',
  cancelled: 'Đã hủy',
}

const PAYMENT_LABEL = {
  pending: 'Chưa thanh toán',
  requested: 'Yêu cầu thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTable, setFilterTable] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [detailOrder, setDetailOrder] = useState(null)
  const [message, setMessage] = useState(null)

  const loadTables = () => {
    // Nap danh sach ban de render bo loc "Theo ban".
    adminApi.tables.list().then(setTables).catch(() => setTables([]))
  }

  const loadOrders = () => {
    // Luong tai du lieu don hang chinh cua trang:
    // goi /api/admin/orders voi 3 bo loc table/status/paymentStatus (neu co).
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
    // Chay 1 lan khi vao trang Quan ly don hang.
    loadTables()
  }, [])

  useEffect(() => {
    // Moi lan doi bo loc thi tai lai danh sach don.
    loadOrders()
  }, [filterTable, filterStatus, filterPayment])

  const showMsg = (type, text) => {
    setMessage({ type, text })
    if (type === 'success') setTimeout(() => setMessage(null), 3000)
  }

  const getTableName = (order) => {
    const t = order.table
    return typeof t === 'object' && t?.name ? t.name : t || '—'
  }

  const updateStatus = async (orderId, status) => {
    // Cap nhat trang thai don (preparing/ready/served/cancelled) tu modal chi tiet.
    try {
      const updated = await adminApi.orders.updateStatus(orderId, status)
      showMsg('success', 'Đã cập nhật trạng thái đơn hàng.')
      setDetailOrder((prev) => (prev?._id === orderId ? updated : prev))
      loadOrders()
    } catch (e) {
      showMsg('error', e instanceof Error ? e.message : 'Cập nhật thất bại.')
    }
  }

  const cancelOrder = async (orderId) => {
    // Huy don la 1 truong hop updateStatus voi gia tri 'cancelled'.
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

  const printInvoice = (order) => {
    // In hoa don nhanh: tao noi dung text, mo popup va goi lenh print cua trinh duyet.
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
      `<pre>HOA DON THANH TOAN\nBan: ${tableName}\nThoi gian: ${
        order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'
      }\n\n${rows}\n\nTong: ${(order.totalAmount ?? 0).toLocaleString('vi-VN')} VND</pre>`,
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
              {Object.keys(STATUS_LABEL).map((s) => (
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
                              : 'bg-brand-500/20 text-brand-400'
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-300">
                        {PAYMENT_LABEL[o.paymentStatus] ?? o.paymentStatus ?? '—'}
                      </span>
                    </td>
                    <td className="p-3 text-white font-medium">
                      {(o.totalAmount ?? 0).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(o)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated text-gray-300 hover:text-white text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chi tiết đơn */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-white font-semibold">
                Chi tiết đơn — Bàn {getTableName(detailOrder)}
              </h3>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="p-2 rounded-lg bg-surface-elevated text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                Thời gian:{' '}
                <span className="text-white">
                  {detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleString('vi-VN') : '—'}
                </span>
              </p>
              <p className="text-gray-300">
                Trạng thái:{' '}
                <span className="text-white">{STATUS_LABEL[detailOrder.status] ?? detailOrder.status}</span>
              </p>
              <p className="text-gray-300">
                Thanh toán:{' '}
                <span className="text-white">
                  {PAYMENT_LABEL[detailOrder.paymentStatus] ?? detailOrder.paymentStatus ?? '—'}
                </span>
              </p>
            </div>

            <div className="card p-3 space-y-2">
              {(detailOrder.items || []).map((item, idx) => {
                const mi = typeof item.menuItem === 'object' ? item.menuItem : null
                const name = mi?.name ?? `Món #${idx + 1}`
                const price = mi?.price ?? 0
                return (
                  <div key={idx} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{name}</p>
                      {item.note ? <p className="text-gray-500">{item.note}</p> : null}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-300">
                        {item.quantity} × {price.toLocaleString('vi-VN')}₫
                      </p>
                      <p className="text-white font-semibold">
                        {(price * (item.quantity || 0)).toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                )
              })}
              <div className="border-t border-gray-700/60 pt-2 flex justify-between">
                <span className="text-gray-400">Tổng</span>
                <span className="text-white font-semibold">
                  {(detailOrder.totalAmount ?? 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={() => printInvoice(detailOrder)} className="btn-secondary">
                In hóa đơn
              </button>
              {detailOrder.status !== 'served' && detailOrder.status !== 'cancelled' && (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus(detailOrder._id, 'preparing')}
                    className="btn-secondary"
                    disabled={detailOrder.status === 'preparing'}
                  >
                    Đang chế biến
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(detailOrder._id, 'ready')}
                    className="btn-secondary"
                    disabled={detailOrder.status === 'ready'}
                  >
                    Sẵn sàng
                  </button>
                  <button type="button" onClick={() => updateStatus(detailOrder._id, 'served')} className="btn-primary">
                    Đã phục vụ
                  </button>
                  <button type="button" onClick={() => cancelOrder(detailOrder._id)} className="btn-danger">
                    Hủy đơn
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

