import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ChefHat, LogOut } from 'lucide-react'
import { AUTH_TOKEN_KEY, logout as doLogout } from '../../utils/auth'

export default function KitchenLayout() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [kitchenUser, setKitchenUser] = useState(null)
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
        if (role === 'kitchen') {
          setKitchenUser(data?.user || null)
          return
        }
        if (role === 'admin' || role === 'manager') navigate('/admin', { replace: true })
        else if (role === 'waiter' || role === 'staff') navigate('/staff', { replace: true })
        else navigate('/login', { replace: true })
      } catch {
        navigate('/login', { replace: true })
      } finally {
        setAuthChecked(true)
      }
    })()
  }, [navigate])

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center text-white">Đang kiểm tra đăng nhập...</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-10 bg-surface-card border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-brand-400" />
            Bếp
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="text-sm text-gray-300 hover:text-white inline-flex items-center gap-1.5 flex-shrink-0"
            >
              {kitchenUser?.name || 'Tài khoản bếp'}
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
      </header>
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
                Họ tên: <span className="text-white">{kitchenUser?.name || '-'}</span>
              </p>
              <p className="text-gray-300">
                Email: <span className="text-white">{kitchenUser?.email || '-'}</span>
              </p>
              <p className="text-gray-300">
                Số điện thoại: <span className="text-white">{kitchenUser?.phone || '-'}</span>
              </p>
              <p className="text-gray-300">
                Vai trò:{' '}
                <span className="text-white">
                  {kitchenUser?.role === 'kitchen' ? 'Bếp' : kitchenUser?.role || '-'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

