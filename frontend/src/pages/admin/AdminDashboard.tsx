import { Link } from 'react-router-dom'
import { UtensilsCrossed, FolderTree, Coffee, Users, BarChart3, CreditCard, Star, MessageSquare } from 'lucide-react'

const links = [
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Quản lý món ăn' },
  { to: '/admin/categories', icon: FolderTree, label: 'Quản lý loại món' },
  { to: '/admin/tables', icon: Coffee, label: 'Quản lý bàn' },
  { to: '/admin/staff', icon: Users, label: 'Quản lý nhân viên' },
  { to: '/admin/stats', icon: BarChart3, label: 'Thống kê & doanh thu' },
  { to: '/admin/payment-methods', icon: CreditCard, label: 'Phương thức thanh toán' },
  { to: '/admin/ratings', icon: Star, label: 'Đánh giá khách hàng' },
  { to: '/admin/complaints', icon: MessageSquare, label: 'Khiếu nại & phản hồi' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Tổng quan</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="card p-5 flex items-center gap-4 hover:border-brand-500/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-brand-400" />
            </div>
            <span className="font-medium text-white">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
