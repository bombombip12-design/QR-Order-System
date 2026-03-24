import { useEffect, useState } from 'react'
import { ordersApi, paymentApi } from '../../api/client'
import type { Order } from '../../types'

export default function StaffPaymentHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Order | null>(null)
  const [confirmMethod, setConfirmMethod] = useState<'cash' | 'momo' | 'bank_transfer'>('cash')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = () =>
    ordersApi
      .listAll()
      .then((list) =>
        setOrders(
          (Array.isArray(list) ? list : [])
            .filter((o) => o.paymentStatus === 'requested' || o.paymentStatus === 'paid')
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        )
      )
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const openDetail = (order: Order) => {
    setDetail(order)
    const method = order.paymentMethod
    if (method === 'momo' || method === 'bank_transfer' || method === 'cash') {
      setConfirmMethod(method)
    } else {
      setConfirmMethod('cash')
    }
  }

  const confirmPaid = async () => {
    if (!detail) return
    setMessage(null)
    setSaving(true)
    try {
      await paymentApi.confirm(detail._id, confirmMethod)
      setDetail(null)
      load()
      setMessage({ type: 'success', text: 'Đã xác nhận thanh toán thành công.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xác nhận thanh toán thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const savePaymentMethod = async () => {
    if (!detail) return
    setMessage(null)
    setSaving(true)
    try {
      try {
        await paymentApi.updateMethod(detail._id, confirmMethod)
      } catch (error) {
        // Backward compatibility when backend has not reloaded the new route yet.
        await paymentApi.confirm(detail._id, confirmMethod)
        void error
      }
      const refreshed = await ordersApi.getById(detail._id)
      setDetail(refreshed)
      load()
      setMessage({ type: 'success', text: 'Đã lưu phương thức thanh toán thành công.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Cập nhật phương thức thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const printInvoice = (order: Order) => {
    const tableName = typeof order.table === 'object' ? order.table?.name : order.table
    const rows = (order.items || [])
      .map((it) => {
        const name = typeof it.menuItem === 'object' ? it.menuItem?.name : 'Món'
        const price = typeof it.menuItem === 'object' ? it.menuItem?.price || 0 : 0
        return `${name} x${it.quantity} - ${(price * (it.quantity || 0)).toLocaleString('vi-VN')} VND`
      })
      .join('\n')
    const popup = window.open('', '_blank')
    if (!popup) return
    popup.document.write(
      `<pre>HOA DON THANH TOAN\nBan: ${tableName}\nThoi gian: ${new Date(order.createdAt).toLocaleString('vi-VN')}\nPhuong thuc: ${order.paymentMethod || 'cash'}\n\n${rows}\n\nTong: ${(order.totalAmount || 0).toLocaleString('vi-VN')} VND</pre>`
    )
    popup.document.close()
    popup.print()
  }

  if (loading) return <div className="text-gray-400">Đang tải lịch sử thanh toán...</div>
  if (orders.length === 0) return <div className="card p-4 text-gray-400">Chưa có lịch sử thanh toán.</div>

  return (
    <div className="space-y-3">
      {message && (
        <div
          className={`card p-3 text-sm border flex justify-between items-center ${
            message.type === 'success'
              ? 'text-green-300 border-green-500/40'
              : 'text-red-300 border-red-500/40'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-gray-300">
            Đóng
          </button>
        </div>
      )}
      <div className="card overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-sm">
            <th className="p-3">Thời gian</th>
            <th className="p-3">Bàn</th>
            <th className="p-3">Phương thức</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Số món</th>
            <th className="p-3">Tổng tiền</th>
            <th className="p-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="border-b border-gray-700/40">
              <td className="p-3 text-gray-300">{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
              <td className="p-3 text-white">Bàn {typeof o.table === 'object' ? o.table?.name : o.table}</td>
              <td className="p-3 text-gray-300">
                {o.paymentMethod === 'momo'
                  ? 'Momo'
                  : o.paymentMethod === 'bank_transfer'
                    ? 'Chuyển khoản ngân hàng'
                    : 'Tiền mặt'}
              </td>
              <td className="p-3">
                {o.paymentStatus === 'paid' ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/30">
                    Hoàn thành
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Đang chờ xác nhận
                  </span>
                )}
              </td>
              <td className="p-3 text-gray-300">{(o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)}</td>
              <td className="p-3 text-brand-400">{(o.totalAmount || 0).toLocaleString('vi-VN')}₫</td>
              <td className="p-3 text-right">
                <button
                  type="button"
                  onClick={() => openDetail(o)}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated text-gray-200 text-sm hover:bg-gray-600"
                >
                  Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-card border border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Chi tiết thanh toán</h3>
              <button type="button" onClick={() => setDetail(null)} className="text-gray-300 hover:text-white">
                Đóng
              </button>
            </div>
            <p className="text-sm text-gray-400">
              Bàn: {typeof detail.table === 'object' ? detail.table?.name : detail.table}
            </p>
            <p className="text-sm text-gray-400">Thời gian: {new Date(detail.createdAt).toLocaleString('vi-VN')}</p>
            <p className="text-sm text-gray-400">
              Phương thức: {detail.paymentMethod === 'momo'
                ? 'Momo'
                : detail.paymentMethod === 'bank_transfer'
                  ? 'Chuyển khoản ngân hàng'
                  : 'Tiền mặt'}
            </p>
            <p className="text-sm text-gray-400">
              Trạng thái: {detail.paymentStatus === 'paid' ? 'Hoàn thành' : 'Đang chờ xác nhận'}
            </p>

            <div
              className={`rounded-lg p-3 space-y-2 ${
                detail.paymentStatus !== 'paid'
                  ? 'border border-amber-500/30 bg-amber-500/10'
                  : 'border border-gray-700 bg-surface-elevated/40'
              }`}
            >
              <p className={`text-sm ${detail.paymentStatus !== 'paid' ? 'text-amber-200' : 'text-gray-300'}`}>
                {detail.paymentStatus !== 'paid'
                  ? 'Chọn phương thức trước khi xác nhận thanh toán'
                  : 'Có thể chỉnh sửa phương thức thanh toán của đơn đã hoàn thành'}
              </p>
              <select
                value={confirmMethod}
                onChange={(e) => setConfirmMethod(e.target.value as 'cash' | 'momo' | 'bank_transfer')}
                className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-gray-600 text-white text-sm"
              >
                <option value="cash">Tiền mặt</option>
                <option value="momo">Momo</option>
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={savePaymentMethod}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu phương thức'}
                </button>
                {detail.paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={confirmPaid}
                    disabled={saving}
                    className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 disabled:opacity-50"
                  >
                    {saving ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Món</th>
                    <th className="px-3 py-2 text-right">SL</th>
                    <th className="px-3 py-2 text-right">Đơn giá</th>
                    <th className="px-3 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it, idx) => {
                    const name = typeof it.menuItem === 'object' ? it.menuItem?.name : 'Món'
                    const price = typeof it.menuItem === 'object' ? it.menuItem?.price || 0 : 0
                    const qty = it.quantity || 0
                    return (
                      <tr key={idx} className="border-t border-gray-700/60">
                        <td className="px-3 py-2 text-gray-200">{name}</td>
                        <td className="px-3 py-2 text-right text-gray-300">{qty}</td>
                        <td className="px-3 py-2 text-right text-gray-300">{price.toLocaleString('vi-VN')}₫</td>
                        <td className="px-3 py-2 text-right text-gray-100">{(price * qty).toLocaleString('vi-VN')}₫</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-right text-brand-400 font-semibold">
              Tổng đơn: {(detail.totalAmount || 0).toLocaleString('vi-VN')}₫
            </p>

            <button
              type="button"
              onClick={() => printInvoice(detail)}
              disabled={detail.paymentStatus !== 'paid'}
              className="w-full py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40 disabled:opacity-50"
            >
              Xuất hóa đơn
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
