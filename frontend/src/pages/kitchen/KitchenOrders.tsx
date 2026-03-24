import { useEffect, useState } from 'react'
import { Loader2, Check, ChefHat } from 'lucide-react'
import { ordersApi, tablesApi } from '../../api/client'
import type { Order } from '../../types'

const statusLabel: Record<string, string> = {
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chế biến',
  ready: 'Đã hoàn thành',
  served: 'Đã phục vụ',
  cancelled: 'Đã hủy',
}

export default function KitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tableNames, setTableNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = () => {
    ordersApi
      .listAll()
      .then((list) => {
        setOrders(
          list.filter((o) =>
            ['confirmed', 'preparing', 'ready'].includes(o.status)
          )
        )
        return tablesApi.list()
      })
      .then((tables) => {
        const map: Record<string, string> = {}
        tables.forEach((t) => {
          map[t._id] = t.name
        })
        setTableNames(map)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const refresh = () => {
    ordersApi
      .listAll()
      .then((list) =>
        setOrders(list.filter((o) => o.status !== 'served' && o.status !== 'cancelled'))
      )
  }

  const handleStatus = async (orderId: string, status: 'preparing' | 'ready') => {
    try {
      await ordersApi.updateStatus(orderId, status)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cập nhật thất bại')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ChefHat className="w-12 h-12 mb-3 opacity-50" />
        <p>Không có đơn cần chế biến.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const tableId = typeof order.table === 'object' ? order.table._id : order.table
        const tableName = tableNames[tableId] ?? tableId
        return (
          <div key={order._id} className="card p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="font-medium text-white">
                Bàn {tableName}
              </span>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  order.status === 'ready'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-brand-500/20 text-brand-400'
                }`}
              >
                {statusLabel[order.status] ?? order.status}
              </span>
            </div>
            <ul className="space-y-2 mb-4">
              {order.items.map((oi, idx) => {
                const name =
                  typeof oi.menuItem === 'object' && oi.menuItem && 'name' in oi.menuItem
                    ? oi.menuItem.name
                    : `Món #${idx + 1}`
                return (
                  <li key={idx} className="text-sm text-gray-300">
                    {name} × {oi.quantity}
                    {oi.note && <span className="text-gray-500"> — {oi.note}</span>}
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-2">
              {order.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => handleStatus(order._id, 'preparing')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 text-sm"
                >
                  <Loader2 className="w-4 h-4" />
                  Đang làm
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  type="button"
                  onClick={() => handleStatus(order._id, 'ready')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm"
                >
                  <Check className="w-4 h-4" />
                  Đã hoàn thành
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
