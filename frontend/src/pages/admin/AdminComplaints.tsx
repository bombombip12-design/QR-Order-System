import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client'
import type { Complaint } from '../../types'

export default function AdminComplaints() {
  const [list, setList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const load = () => {
    setLoading(true)
    adminApi.complaints
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('vi-VN') : '—')

  const handleResolve = async (id: string) => {
    try {
      await adminApi.complaints.resolve(id, note)
      setResolvingId(null)
      setNote('')
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xử lý.')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Khiếu nại của khách hàng</h2>

      {loading ? (
        <div className="text-gray-400 py-8">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">Chưa có khiếu nại</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="p-3 font-medium">Đơn hàng</th>
                  <th className="p-3 font-medium">Nội dung</th>
                  <th className="p-3 font-medium">Trạng thái</th>
                  <th className="p-3 font-medium">Thời gian</th>
                  <th className="p-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="p-3 text-white text-sm">{c.orderId}</td>
                    <td className="p-3 text-gray-300 text-sm">{c.content}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                          c.resolved ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {c.resolved ? 'Đã xử lý' : 'Chờ xử lý'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 text-sm">{formatDate(c.createdAt)}</td>
                    <td className="p-3">
                      {c.resolved ? (
                        <span className="text-gray-500 text-sm">—</span>
                      ) : resolvingId === c.id ? (
                        <div className="space-y-2">
                          <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ghi chú xử lý"
                            className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
                          />
                          <div className="flex gap-2">
                            <button type="button" className="btn-primary" onClick={() => handleResolve(c.id)}>
                              Xác nhận
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setResolvingId(null)
                                setNote('')
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            setResolvingId(c.id)
                            setNote('')
                          }}
                        >
                          Xử lý
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

