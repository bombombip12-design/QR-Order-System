import { useEffect } from 'react'
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom'
import { ShoppingBag, ShoppingCart, ClipboardList, Wallet } from 'lucide-react'
import { useSetTable, useTableName } from '../../context/TableContext'
import { useCart } from '../../context/CartContext'
import { tablesApi } from '../../api/client'

export default function CustomerLayout() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const setTable = useSetTable()
  const tableName = useTableName()
  const { totalItems } = useCart()

  useEffect(() => {
    if (!tableId) return
    setTable(tableId, null)
    tablesApi
      .get(tableId)
      .then((t) => setTable(t._id, t.name))
      .catch(() => setTable(tableId, `Bàn ${tableId}`))
  }, [tableId, setTable])

  if (!tableId) {
    navigate('/', { replace: true })
    return null
  }

  const nav = [
    { to: `/table/${tableId}`, icon: ShoppingBag, label: 'Menu' },
    { to: `/table/${tableId}/cart`, icon: ShoppingCart, label: 'Giỏ hàng', badge: totalItems },
    { to: `/table/${tableId}/orders`, icon: ClipboardList, label: 'Đơn hàng' },
    { to: `/table/${tableId}/payment`, icon: Wallet, label: 'Thanh toán' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-10 bg-surface-card border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">{tableName ? `Bàn ${tableName}` : `Bàn ${tableId}`}</h1>
        </div>
        <nav className="flex gap-2 mt-3">
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge != null && badge > 0 && <span className="bg-white/20 rounded-full px-1.5 text-xs">{badge}</span>}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>
    </div>
  )
}

