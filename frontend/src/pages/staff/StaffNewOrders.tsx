import { useEffect, useState } from 'react'
import { ordersApi, paymentApi } from '../../api/client'
import type { Order } from '../../types'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chế biến',
  ready: 'Sẵn sàng',
  served: 'Đã phục vụ',
  cancelled: 'Đã hủy',
}

export default function StaffNewOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null)
  const getOrderId = (order: Partial<Order> | null | undefined) =>
    String((order as { _id?: string; id?: string } | null)?._id || (order as { id?: string } | null)?.id || '')

  const load = () => {
    setLoading(true)
    ordersApi
      .listAll()
      .then((resp) =>
        setOrders(
          (Array.isArray(resp) ? resp : []).filter(
            (o) => o.paymentStatus !== 'paid' && o.status !== 'cancelled'
          )
        )
      )
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openDetail = async (id: string) => {
    try {
      const order = await ordersApi.getById(id)
      setDetail(order)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không tải được chi tiết đơn')
    }
  }

  const confirmOrder = async () => {
    if (!detail) return
    const orderId = getOrderId(detail)
    if (!orderId) return setMessage({ type: 'error', text: 'Không tìm thấy mã đơn hàng.' })
    setSaving(true)
    try {
      await ordersApi.updateStatus(orderId, 'confirmed')
      setDetail(null)
      setMessage({ type: 'success', text: 'Đã xác nhận đơn hàng thành công.' })
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xác nhận đơn thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (idx: number, patch: { quantity?: number; note?: string }) => {
    if (!detail) return
    const next = [...detail.items]
    const target = next[idx]
    next[idx] = {
      ...target,
      ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
      ...(patch.note !== undefined ? { note: patch.note } : {}),
    }
    setDetail({ ...detail, items: next })
  }

  const removeItem = (idx: number) => {
    if (!detail) return
    const next = detail.items.filter((_, i) => i !== idx)
    setDetail({ ...detail, items: next })
  }

  const saveEdit = async () => {
    if (!detail) return
    const orderId = getOrderId(detail)
    if (!orderId) return setMessage({ type: 'error', text: 'Không tìm thấy mã đơn hàng.' })
    const payload = detail.items
      .map((it) => ({
        menuItem: typeof it.menuItem === 'object' && it.menuItem ? it.menuItem._id : String(it.menuItem || ''),
        quantity: Number(it.quantity || 1),
        note: it.note || '',
      }))
      .filter((it) => it.menuItem && it.quantity > 0)
    if (payload.length === 0) return alert('Đơn phải còn ít nhất 1 món')

    setSaving(true)
    try {
      const updated = await ordersApi.update(orderId, payload)
      setDetail(null)
      setMessage({ type: 'success', text: 'Lưu chỉnh sửa đơn hàng thành công.' })
      void updated
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Sửa đơn thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const confirmPaid = async () => {
    if (!detail) return
    const orderId = getOrderId(detail)
    if (!orderId) return setMessage({ type: 'error', text: 'Không tìm thấy mã đơn hàng.' })
    const selectedMethod =
      detail.paymentMethod === 'momo' || detail.paymentMethod === 'bank_transfer' || detail.paymentMethod === 'cash'
        ? detail.paymentMethod
        : 'cash'
    setSaving(true)
    try {
      await paymentApi.confirm(orderId, selectedMethod)
      setDetail(null)
      setMessage({ type: 'success', text: 'Đã xác nhận thanh toán thành công.' })
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xác nhận thanh toán thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const deleteOrder = async () => {
    if (!detail) return
    const orderId = getOrderId(detail)
    if (!orderId) return setMessage({ type: 'error', text: 'Không tìm thấy mã đơn hàng.' })
    setSaving(true)
    try {
      try {
        await ordersApi.delete(orderId)
      } catch {
        // Fallback when DELETE route has not been reloaded yet.
        await ordersApi.updateStatus(orderId, 'cancelled')
      }
      setDetail(null)
      setConfirmDeleteOrderId(null)
      setMessage({ type: 'success', text: 'Xóa đơn hàng thành công.' })
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xóa đơn thất bại' })
    } finally {
      setSaving(false)
    }
  }

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
      {loading && <div className="text-gray-400">Đang tải đơn mới...</div>}
      {!loading && orders.length === 0 && <div className="card p-4 text-gray-400">Không có đơn mới.</div>}
      {!loading && orders.length > 0 && (
        <>
          {orders.map((o) => (
        <div
          key={getOrderId(o)}
          role="button"
          tabIndex={0}
          onClick={() => openDetail(getOrderId(o))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openDetail(getOrderId(o))
          }}
          className="card p-4 w-full text-left cursor-pointer"
        >
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-white font-medium">Bàn {typeof o.table === 'object' ? o.table?.name : o.table}</p>
              <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <span
              className={`px-2 py-1 rounded-lg text-xs h-fit ${
                o.status === 'confirmed'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-brand-500/20 text-brand-400'
              }`}
            >
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            {o.items.map((it, idx) => (
              <li key={idx} className="text-gray-300">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {(typeof it.menuItem === 'object' ? it.menuItem?.name : 'Món')} x{it.quantity}
                    {it.note ? ` - ${it.note}` : ''}
                  </span>
                  <span className="text-brand-400">
                    {(
                      ((typeof it.menuItem === 'object' && it.menuItem?.price) || 0) * (it.quantity || 0)
                    ).toLocaleString('vi-VN')}
                    ₫
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-brand-400 font-medium">
            Tổng đơn: {(o.totalAmount || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
          ))}
        </>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-card border border-gray-700 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold">Chi tiết đơn hàng</h3>
              <button type="button" onClick={() => setDetail(null)} className="text-gray-300 hover:text-white">Đóng</button>
            </div>
            <p className="text-sm text-gray-400">Bàn {typeof detail.table === 'object' ? detail.table?.name : detail.table}</p>
            <p className="text-sm text-gray-400">
              Phương thức khách chọn:{' '}
              <span className="text-white">
                {detail.paymentMethod === 'momo'
                  ? 'Momo'
                  : detail.paymentMethod === 'bank_transfer'
                    ? 'Chuyển khoản ngân hàng'
                    : 'Tiền mặt'}
              </span>
            </p>
            <div className="space-y-2">
              {detail.items.map((it, idx) => {
                const name = typeof it.menuItem === 'object' && it.menuItem ? it.menuItem.name : 'Món'
                return (
                  <div key={idx} className="rounded-lg bg-surface-elevated p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-white">{name}</p>
                      <p className="text-xs text-brand-400">
                        {(
                          ((typeof it.menuItem === 'object' && it.menuItem?.price) || 0) * (it.quantity || 0)
                        ).toLocaleString('vi-VN')}
                        ₫
                      </p>
                      <button type="button" className="text-xs text-red-400" onClick={() => removeItem(idx)}>
                        Xóa món
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 1) })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-card border border-gray-600 text-white"
                    />
                    <input
                      type="text"
                      value={it.note || ''}
                      onChange={(e) => updateItem(idx, { note: e.target.value })}
                      placeholder="Ghi chú"
                      className="w-full px-3 py-2 rounded-lg bg-surface-card border border-gray-600 text-white"
                    />
                  </div>
                )
              })}
            </div>
            <p className="text-right text-brand-400 font-semibold">
              Tổng đơn: {(detail.totalAmount || 0).toLocaleString('vi-VN')}₫
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={saveEdit} disabled={saving} className="btn-secondary flex-1">
                Lưu chỉnh sửa
              </button>
              <button type="button" onClick={confirmOrder} disabled={saving} className="btn-primary flex-1">
                Xác nhận đơn
              </button>
              {detail.paymentStatus !== 'paid' && detail.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={confirmPaid}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40"
                >
                  Xác nhận đã thanh toán
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmDeleteOrderId(getOrderId(detail))}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40"
              >
                Xóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteOrderId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận xóa đơn</h3>
            <p className="text-sm text-gray-300">Bạn có chắc muốn xóa đơn này không?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOrderId(null)}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-surface-elevated text-gray-200 hover:bg-gray-600 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={deleteOrder}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50"
              >
                {saving ? 'Đang xóa...' : 'Xóa đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
