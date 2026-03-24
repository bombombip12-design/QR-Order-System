import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ChefHat, LogOut } from 'lucide-react'
import { AUTH_TOKEN_KEY, logout as doLogout } from '../../utils/auth'

export default function KitchenLayout() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)

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
        if (role === 'kitchen') return
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
          <button
            type="button"
            onClick={() => doLogout(navigate)}
            className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1.5 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
