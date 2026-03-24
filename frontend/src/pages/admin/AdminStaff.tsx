import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminApi } from '../../api/client'
import type { User } from '../../types'

const roleLabel: Record<string, string> = {
  waiter: 'Phục vụ',
  kitchen: 'Bếp',
  admin: 'Admin',
}
const STAFF_ROLES: Array<'waiter' | 'kitchen'> = ['waiter', 'kitchen']

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export default function AdminStaff() {
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'waiter' | 'kitchen'>('waiter')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = () => {
    adminApi.users
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    if (type === 'success') setTimeout(() => setMessage(null), 4000)
  }

  const openCreate = () => {
    setCreating(true)
    setEditing(null)
    setName('')
    setEmail('')
    setPhone('')
    setRole('waiter')
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setCreating(false)
    setName(u.name)
    setEmail(u.email)
    setPhone(u.phone ?? '')
    setRole(u.role === 'admin' ? 'waiter' : u.role)
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  const cancelForm = () => {
    setCreating(false)
    setEditing(null)
    setName('')
    setEmail('')
    setPhone('')
    setRole('waiter')
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  const validateCreate = (): string | null => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const phoneDigits = getPhoneDigits(phone)
    if (!trimmedName) return 'Vui lòng nhập họ tên.'
    if (!trimmedEmail) return 'Vui lòng nhập email.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) return 'Email không hợp lệ.'
    if (!phoneDigits) return 'Vui lòng nhập số điện thoại.'
    if (phoneDigits.length !== 10) return 'Số điện thoại phải có đủ 10 số.'
    if (!password) return 'Vui lòng nhập mật khẩu.'
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.'
    if (password !== confirmPassword) return 'Xác nhận mật khẩu không khớp.'
    return null
  }

  const save = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const phoneDigits = getPhoneDigits(phone)

    if (editing) {
      if (!trimmedName) {
        showMessage('error', 'Vui lòng nhập họ tên.')
        return
      }
      if (!trimmedEmail) {
        showMessage('error', 'Vui lòng nhập email.')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        showMessage('error', 'Email không hợp lệ.')
        return
      }
      if (phoneDigits && phoneDigits.length !== 10) {
        showMessage('error', 'Số điện thoại phải có đủ 10 số.')
        return
      }
      try {
        await adminApi.users.update(editing._id, {
          name: trimmedName,
          email: trimmedEmail,
          role: editing.role === 'admin' ? 'admin' : role,
          ...(phoneDigits ? { phone: phoneDigits } : {}),
        })
        setCreating(false)
        setEditing(null)
        setName('')
        setEmail('')
        setPhone('')
        setRole('waiter')
        setPassword('')
        setConfirmPassword('')
        load()
        showMessage('success', 'Cập nhật nhân viên thành công.')
      } catch (e) {
        showMessage('error', e instanceof Error ? e.message : 'Cập nhật thất bại.')
      }
      return
    }

    if (creating) {
      const err = validateCreate()
      if (err) {
        showMessage('error', err)
        return
      }
      try {
        await adminApi.users.create({
          name: trimmedName,
          email: trimmedEmail,
          phone: phoneDigits,
          password,
          role,
        })
        setCreating(false)
        setEditing(null)
        setName('')
        setEmail('')
        setPhone('')
        setRole('waiter')
        setPassword('')
        setConfirmPassword('')
        load()
        showMessage('success', 'Thêm nhân viên thành công.')
      } catch (e) {
        showMessage('error', e instanceof Error ? e.message : 'Thêm nhân viên thất bại.')
      }
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Xóa nhân viên này khỏi danh sách?')) return
    try {
      await adminApi.users.delete(id)
      setCreating(false)
      setEditing(null)
      setName('')
      setEmail('')
      setPhone('')
      setRole('waiter')
      setPassword('')
      setConfirmPassword('')
      load()
      showMessage('success', 'Đã xóa nhân viên.')
    } catch (e) {
      showMessage('error', e instanceof Error ? e.message : 'Xóa thất bại.')
    }
  }

  if (loading) {
    return <div className="text-gray-400 py-8">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Nhân viên</h2>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {(creating || editing) && (
        <div className="card p-4 space-y-3">
          <input
            type="text"
            placeholder="Họ tên *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
            disabled={!!editing}
          />
          {editing && (
            <p className="text-xs text-gray-500">Không thể đổi email khi sửa. Xóa và tạo mới nếu cần.</p>
          )}
          <input
            type="tel"
            placeholder="Số điện thoại (10 số) *"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          {creating && (
            <>
              <input
                type="password"
                placeholder="Mật khẩu (ít nhất 6 ký tự) *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="Xác nhận mật khẩu *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
                autoComplete="new-password"
              />
            </>
          )}
          {editing?.role === 'admin' ? (
            <p className="text-sm text-gray-400">Vai trò: Admin (đăng nhập quản trị)</p>
          ) : (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'waiter' | 'kitchen')}
              className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{roleLabel[r]}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={save} className="btn-primary">
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
            <button type="button" onClick={cancelForm} className="btn-secondary">
              Hủy
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {list.map((u) => (
          <li key={u._id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{u.name}</p>
              <p className="text-sm text-gray-400">{u.email}</p>
              {u.phone && <p className="text-sm text-gray-500">{u.phone}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-surface-elevated text-gray-300 text-sm">
                {roleLabel[u.role] ?? u.role}
              </span>
              <button
                type="button"
                onClick={() => openEdit(u)}
                className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white"
                title="Sửa"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(u._id)}
                className="p-2 rounded-lg bg-surface-elevated text-red-400 hover:bg-red-500/20"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && !creating && (
        <p className="text-gray-400 text-center py-8">Chưa có nhân viên. Nhấn &quot;Thêm nhân viên&quot; để tạo.</p>
      )}
    </div>
  )
}
