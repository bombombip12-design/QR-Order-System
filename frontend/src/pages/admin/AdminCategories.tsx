import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminApi } from '../../api/client'
import type { Category } from '../../types'

export default function AdminCategories() {
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = () => {
    adminApi.categories
      .list()
      .then(setList)
      .catch(() => setList([]))
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
    setDescription('')
  }

  const openEdit = (c: Category) => {
    setMessage(null)
    setEditing(c)
    setCreating(false)
    setName(c.name)
    setDescription(c.description ?? '')
  }

  const save = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên loại món.' })
      return
    }
    try {
      if (editing) {
        await adminApi.categories.update(editing._id, { name: name.trim(), description: description.trim() || undefined })
        setEditing(null)
        setMessage({ type: 'success', text: 'Cập nhật loại món thành công.' })
      } else if (creating) {
        await adminApi.categories.create({ name: name.trim(), description: description.trim() || undefined })
        setCreating(false)
        setMessage({ type: 'success', text: 'Thêm loại món thành công.' })
      }
      setName('')
      setDescription('')
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lỗi khi lưu loại món.' })
    }
  }

  const remove = async () => {
    if (!confirmDeleteId) return
    try {
      await adminApi.categories.delete(confirmDeleteId)
      setConfirmDeleteId(null)
      setMessage({ type: 'success', text: 'Xóa loại món thành công.' })
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xóa loại món thất bại.' })
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
        <h2 className="text-xl font-semibold text-white">Loại món</h2>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm loại
        </button>
      </div>

      {(creating || editing) && (
        <div className="card p-4 space-y-3">
          <input
            type="text"
            placeholder="Tên loại món"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <input
            type="text"
            placeholder="Mô tả (tùy chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <div className="flex gap-2">
            <button type="button" onClick={save} className="btn-primary">
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditing(null); setName(''); setDescription(''); }}
              className="btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c._id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{c.name}</p>
              {c.description && <p className="text-sm text-gray-400">{c.description}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(c)} className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setConfirmDeleteId(c._id)} className="p-2 rounded-lg bg-surface-elevated text-red-400 hover:bg-red-500/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && !creating && (
        <p className="text-gray-400 text-center py-8">Chưa có loại món. Nhấn &quot;Thêm loại&quot; để tạo.</p>
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận xóa loại món</h3>
            <p className="text-sm text-gray-300">Bạn có chắc muốn xóa loại món này không?</p>
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
                Xóa loại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
