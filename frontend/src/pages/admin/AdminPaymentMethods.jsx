import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { adminApi } from '../../api/client'

export default function AdminPaymentMethods() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)

  const load = () => {
    setLoading(true)
    adminApi.paymentMethods
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const startCreate = () => {
    setEditing(null)
    setCreating(true)
    setName('')
    setActive(true)
  }

  const startEdit = (m) => {
    setEditing(m)
    setCreating(false)
    setName(m.name)
    setActive(m.active)
  }

  const save = async () => {
    if (!name.trim()) return
    try {
      if (editing) {
        await adminApi.paymentMethods.update(editing.id, { name: name.trim(), active })
      } else {
        await adminApi.paymentMethods.create({ name: name.trim(), active })
      }
      setEditing(null)
      setCreating(false)
      setName('')
      setActive(true)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  const toggleActive = async (id, nextActive) => {
    try {
      await adminApi.paymentMethods.patchActive(id, nextActive)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Phương thức thanh toán</h2>
        <button type="button" onClick={startCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm
        </button>
      </div>

      {(creating || editing !== null) && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-gray-400">{editing ? 'Chỉnh sửa' : 'Tạo mới'}</p>
          <input
            type="text"
            placeholder="Tên phương thức (vd: Tiền mặt, Chuyển khoản)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Đang bật
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={save} className="btn-primary">
              {editing ? 'Lưu' : 'Tạo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setCreating(false)
                setName('')
                setActive(true)
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 py-8">Đang tải...</div>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => (
            <li key={m.id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{m.name}</p>
                <p className="text-sm text-gray-400">{m.active ? 'Đang bật' : 'Đang tắt'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white"
                  title="Sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(m.id, !m.active)}
                  className={`p-2 rounded-lg bg-surface-elevated ${
                    m.active ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  {m.active ? 'Tắt' : 'Bật'}
                </button>
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="text-gray-400 py-8 text-center">Chưa có phương thức</li>}
        </ul>
      )}
    </div>
  )
}

