import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Coffee,
  Users,
  BarChart3,
  ShoppingBag,
  CreditCard,
  Star,
  LogOut,
} from 'lucide-react'
import { AUTH_TOKEN_KEY, logout as doLogout } from '../../utils/auth'

/**
 * Khung admin: menu trái (mỗi mục khớp Route trong App.tsx + adminApi trong client.ts) và Outlet.
 * useEffect: JWT + GET /api/auth/me — chỉ admin/manager giữ trang; còn lại chuyển login hoặc staff/kitchen.
 */
const nav = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Món ăn' },
  { to: '/admin/categories', icon: FolderTree, label: 'Loại món' },
  { to: '/admin/tables', icon: Coffee, label: 'Bàn' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { to: '/admin/staff', icon: Users, label: 'Nhân viên' },
  { to: '/admin/stats', icon: BarChart3, label: 'Thống kê' },
  { to: '/admin/payment-methods', icon: CreditCard, label: 'Phương thức' },
  { to: '/admin/ratings', icon: Star, label: 'Đánh giá' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

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
        if (role === 'admin' || role === 'manager') {
          setIsAdmin(true)
          return
        }

        if (role === 'waiter' || role === 'staff') navigate('/staff', { replace: true })
        else if (role === 'kitchen') navigate('/kitchen', { replace: true })
        else navigate('/login', { replace: true })
      } catch {
        // token hết hạn/không hợp lệ/không phải admin
      } finally {
        setAuthChecked(true)
      }

      if (!isAdmin) navigate('/login', { replace: true })
    })()
  }, [navigate])

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center text-white">Đang kiểm tra đăng nhập...</div>
  }
  if (!isAdmin) return null

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-10 bg-surface-card border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-white">Quản lý</h1>
          <button
            type="button"
            onClick={() => doLogout(navigate)}
            className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1.5 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
        <nav className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {nav.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

