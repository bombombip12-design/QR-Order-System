import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { adminApi, ordersApi } from '../../api/client'
import type { Order, Table } from '../../types'

/** URL đặt món khách theo số bàn: /table/1 */
function getTableOrderUrlByNumber(tableNumber: number): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/table/${tableNumber}`
}

/** Ưu tiên orderUrl; không thì /table/{số bàn}; cuối cùng mới fallback _id */
function getTableLinkUrl(t: Table): string {
  const u = t.orderUrl?.trim()
  if (u) return u
  if (t.tableNumber != null && !Number.isNaN(Number(t.tableNumber))) {
    return getTableOrderUrlByNumber(Number(t.tableNumber))
  }
  if (typeof window !== 'undefined') return `${window.location.origin}/table/${t._id}`
  return ''
}

function tableCapacity(t: Table): number | undefined {
  const c = t.capacity ?? t.seats
  return c != null && !Number.isNaN(Number(c)) ? Number(c) : undefined
}

function isProbablyImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u.pathname)
  } catch {
    return false
  }
}

function statusInfo(status?: Table['status']) {
  if (status === 'occupied') {
    return {
      label: 'Có khách',
      badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
      card: 'border-red-500/40',
    }
  }
  if (status === 'reserved') {
    return {
      label: 'Đặt trước',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      card: 'border-amber-500/40',
    }
  }
  return {
    label: 'Trống',
    badge: 'bg-green-500/20 text-green-300 border border-green-500/40',
    card: 'border-green-500/40',
  }
}

export default function AdminTables() {
  const [list, setList] = useState<Table[]>([])
  const [ordersByTable, setOrdersByTable] = useState<Record<string, Order[]>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Table | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [orderUrl, setOrderUrl] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)

  const load = () => {
    adminApi.tables
      .list()
      .then((tables) => {
        setList(tables || [])
        return Promise.all((tables || []).map((t) => ordersApi.byTable(t._id))).then((orderLists) => {
          const map: Record<string, Order[]> = {}
          ;(tables || []).forEach((t, i) => {
            map[t._id] = orderLists[i] || []
          })
          setOrdersByTable(map)
        })
      })
      .catch(() => {
        setList([])
        setOrdersByTable({})
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setMessage(null)
    setCreating(true)
    setEditing(null)
    setName('')
    setCapacity('')
    setOrderUrl('')
  }

  const openEdit = (t: Table) => {
    setMessage(null)
    setEditing(t)
    setCreating(false)
    setName(t.name)
    setCapacity(tableCapacity(t) != null ? String(tableCapacity(t)) : '')
    setOrderUrl(t.orderUrl?.trim() ?? '')
  }

  const save = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên bàn.' })
      return
    }
    try {
      if (editing) {
        await adminApi.tables.update(editing._id, {
          name: name.trim(),
          capacity: capacity ? Number(capacity) : undefined,
          orderUrl: orderUrl.trim() || undefined,
        } as Partial<Table>)
        setEditing(null)
        setMessage({ type: 'success', text: 'Cập nhật bàn thành công.' })
      } else if (creating) {
        await adminApi.tables.create({
          name: name.trim(),
          capacity: capacity ? Number(capacity) : undefined,
          orderUrl: orderUrl.trim() || undefined,
        })
        setCreating(false)
        setMessage({ type: 'success', text: 'Thêm bàn thành công.' })
      }
      setName('')
      setCapacity('')
      setOrderUrl('')
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lỗi khi lưu bàn.' })
    }
  }

  const remove = async () => {
    if (!confirmDeleteId) return
    try {
      await adminApi.tables.delete(confirmDeleteId)
      setConfirmDeleteId(null)
      setMessage({ type: 'success', text: 'Xóa bàn thành công.' })
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lỗi khi xóa bàn.' })
    }
  }

  if (loading) {
    return <div className="text-gray-400 py-8">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Bàn</h2>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm bàn
        </button>
      </div>

      {(creating || editing) && (
        <div className="card p-4 space-y-3">
          <input
            type="text"
            placeholder="Tên bàn (vd: 1, A1) *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <input
            type="number"
            min={1}
            placeholder="Số chỗ (tùy chọn)"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <input
            type="url"
            placeholder="Link URL đặt món tại bàn (dán link đầy đủ, tùy chọn)"
            value={orderUrl}
            onChange={(e) => setOrderUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          {editing && (
            <div className="rounded-xl bg-white p-3 inline-block">
              <p className="text-xs text-gray-600 mb-2 font-medium">Mã QR — khách quét để đặt món</p>
              <QRCodeSVG value={getTableLinkUrl(editing)} size={160} level="M" includeMargin />
              {editing.orderUrl?.trim() && isProbablyImageUrl(editing.orderUrl.trim()) ? (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Ảnh từ URL</p>
                  <img
                    src={editing.orderUrl.trim()}
                    alt=""
                    className="max-w-[160px] max-h-32 object-contain rounded"
                  />
                </div>
              ) : null}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmSave(true)} className="btn-primary">
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setEditing(null)
                setName('')
                setCapacity('')
                setOrderUrl('')
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {list.map((t) => {
          const orders = ordersByTable[t._id] || []
          const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid')
          const effectiveStatus: Table['status'] = activeOrders.length > 0 ? 'occupied' : 'available'
          const s = statusInfo(effectiveStatus)
          return (
          <li key={t._id} className={`card p-4 flex items-center justify-between gap-4 border ${s.card}`}>
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0 rounded-lg bg-white p-2" title={getTableLinkUrl(t)}>
                <QRCodeSVG value={getTableLinkUrl(t)} size={80} level="M" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-white">Bàn {t.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${s.badge}`}>{s.label}</span>
                </div>
                {tableCapacity(t) != null && (
                  <p className="text-sm text-gray-400">{tableCapacity(t)} chỗ</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]" title={getTableLinkUrl(t)}>
                  {t.orderUrl?.trim() ? getTableLinkUrl(t) : 'Link mặc định theo bàn'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => openEdit(t)}
                className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white"
                title="Sửa"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(t._id)}
                className="p-2 rounded-lg bg-surface-elevated text-red-400 hover:bg-red-500/20"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        )})}
      </ul>
      {list.length === 0 && !creating && (
        <p className="text-gray-400 text-center py-8">Chưa có bàn. Nhấn &quot;Thêm bàn&quot; để tạo bàn và mã QR.</p>
      )}
      {confirmSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận {editing ? 'cập nhật' : 'thêm'} bàn</h3>
            <p className="text-sm text-gray-300">
              Bạn có chắc muốn {editing ? 'cập nhật' : 'thêm'} bàn này không?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSave(false)}
                className="flex-1 py-2 rounded-lg bg-surface-elevated text-gray-200 hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmSave(false)
                  save()
                }}
                className="flex-1 py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40 hover:bg-brand-500/30"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận xóa bàn</h3>
            <p className="text-sm text-gray-300">Bạn có chắc muốn xóa bàn này không?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-lg bg-surface-elevated text-gray-200 hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={remove}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
              >
                Xóa bàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
