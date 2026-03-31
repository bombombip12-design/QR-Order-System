import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, Pencil } from 'lucide-react'
import { tablesApi, ordersApi } from '../../api/client'

export default function StaffTables() {
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [ordersByTable, setOrdersByTable] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [editStatus, setEditStatus] = useState('available')
  const [saving, setSaving] = useState(false)

  const load = () => {
    tablesApi
      .list()
      .then((list) => {
        setTables(list)
        return Promise.all(list.map((t) => ordersApi.byTable(t._id))).then((orderLists) => {
          const map = {}
          list.forEach((t, i) => {
            map[t._id] = orderLists[i] || []
          })
          setOrdersByTable(map)
        })
      })
      .catch(() => setTables([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const statusInfo = (status) => {
    if (status === 'occupied')
      return { label: 'Đang có khách', bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-300' }
    if (status === 'reserved')
      return { label: 'Đã đặt trước', bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-300' }
    return { label: 'Trống', bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-300' }
  }

  const openEdit = (t) => {
    setEditing(t)
    setEditStatus(t.status || 'available')
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await tablesApi.update(editing._id, { status: editStatus })
      setEditing(null)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cập nhật bàn thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Đang tải bàn...</div>
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Coffee className="w-12 h-12 mb-3 opacity-50" />
        <p>Chưa có bàn nào.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => {
        const orders = ordersByTable[table._id] || []
        const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid')
        const pendingCount = activeOrders.length
        const effectiveStatus = pendingCount > 0 ? 'occupied' : 'available'
        const info = statusInfo(effectiveStatus)
        return (
          <div
            key={table._id}
            className={`card p-5 text-left transition-colors border ${info.bg} ${info.border}`}
            onClick={() => navigate(`/staff/table/${table._id}`)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white flex-1">Bàn {table.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(table)
                }}
                className="p-2 rounded-lg bg-surface-elevated text-gray-300 hover:text-white"
                title="Chỉnh sửa bàn"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-sm">{pendingCount} đơn</span>
              )}
            </div>
            <p className={`text-sm mt-2 ${info.text}`}>{info.label}</p>
            <p className="text-sm text-gray-400 mt-1">{activeOrders.length} đơn hàng</p>
            <p className="text-sm text-gray-400">Sức chứa: {table.capacity ?? table.seats ?? 0} người</p>
          </div>
        )
      })}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card border border-gray-700 p-4 space-y-3">
            <h3 className="text-white font-semibold">Chỉnh sửa bàn {editing.name}</h3>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Trạng thái</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-gray-600 text-white"
              >
                <option value="available">Không có người (xanh)</option>
                <option value="occupied">Có người dùng (đỏ)</option>
                <option value="reserved">Có người đặt (vàng)</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-400">
                Sức chứa bàn: <span className="text-white">{editing.capacity ?? editing.seats ?? 0} người</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1" disabled={saving}>
                Hủy
              </button>
              <button type="button" onClick={saveEdit} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

