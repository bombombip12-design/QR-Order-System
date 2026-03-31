import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, BellPlus, History } from 'lucide-react'
import { AUTH_TOKEN_KEY, logout as doLogout } from '../../utils/auth'
import { callsApi } from '../../api/client'

export default function StaffLayout() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [pendingCalls, setPendingCalls] = useState([])
  const [staffUser, setStaffUser] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setAuthChecked(true)
      navigate('/login', { replace: true })
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Invalid token')
        const data = await res.json()
        const role = data?.user?.role
        if (role === 'waiter' || role === 'staff') {
          setStaffUser(data?.user || null)
          return
        }
        if (role === 'admin' || role === 'manager') navigate('/admin', { replace: true })
        else if (role === 'kitchen') navigate('/kitchen', { replace: true })
        else navigate('/login', { replace: true })
      } catch {
        navigate('/login', { replace: true })
      } finally {
        setAuthChecked(true)
      }
    })()
  }, [navigate])

  useEffect(() => {
    let mounted = true
    const loadPendingCalls = async () => {
      try {
        const calls = await callsApi.list()
        if (!mounted) return
        setPendingCalls((calls || []).filter((c) => c.status === 'pending'))
      } catch {
        if (mounted) setPendingCalls([])
      }
    }

    loadPendingCalls()
    const id = window.setInterval(loadPendingCalls, 4000)
    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [])

  const markHandled = async (callId) => {
    try {
      await callsApi.handle(callId)
      setPendingCalls((prev) => prev.filter((c) => c._id !== callId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xử lý thông báo thất bại')
    }
  }

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center text-white">Đang kiểm tra đăng nhập...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-10 bg-surface-card border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-white">Nhân viên</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="text-sm text-gray-300 hover:text-white inline-flex items-center gap-1.5 flex-shrink-0"
            >
              {staffUser?.name || 'Tài khoản staff'}
            </button>
            <button
              type="button"
              onClick={() => doLogout(navigate)}
              className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1.5 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
        <nav className="flex gap-2 mt-3">
          <NavLink
            to="/staff"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                isActive ? 'bg-brand-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            Danh sách bàn
          </NavLink>
          <NavLink
            to="/staff/new-orders"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                isActive ? 'bg-brand-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'
              }`
            }
          >
            <BellPlus className="w-4 h-4" />
            Đơn hàng
          </NavLink>
          <NavLink
            to="/staff/payment-history"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                isActive ? 'bg-brand-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'
              }`
            }
          >
            <History className="w-4 h-4" />
            Lịch sử thanh toán
          </NavLink>
        </nav>
      </header>

      {pendingCalls.length > 0 && (
        <div className="px-4 pt-4 space-y-2">
          {pendingCalls.map((call) => {
            const tableName = typeof call.table === 'object' ? call.table?.name : call.table
            return (
              <div
                key={call._id}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-center justify-between gap-3"
              >
                <p className="text-sm text-amber-300">
                  Bàn <span className="font-semibold">{tableName}</span>{' '}
                  {call.type === 'payment' ? 'yêu cầu thanh toán' : 'cần hỗ trợ'}
                </p>
                <button
                  type="button"
                  onClick={() => markHandled(call._id)}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated text-gray-200 text-sm hover:bg-gray-600"
                >
                  Đã xem
                </button>
              </div>
            )
          })}
        </div>
      )}

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card border border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Thông tin tài khoản</h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-300 hover:text-white"
              >
                Đóng
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                Họ tên: <span className="text-white">{staffUser?.name || '-'}</span>
              </p>
              <p className="text-gray-300">
                Email: <span className="text-white">{staffUser?.email || '-'}</span>
              </p>
              <p className="text-gray-300">
                Số điện thoại: <span className="text-white">{staffUser?.phone || '-'}</span>
              </p>
              <p className="text-gray-300">
                Vai trò: <span className="text-white">{staffUser?.role || 'staff'}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

