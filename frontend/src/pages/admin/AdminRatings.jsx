import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client'

export default function AdminRatings() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminApi.ratings
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—')

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Đánh giá của khách hàng</h2>

      {loading ? (
        <div className="text-gray-400 py-8">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">Chưa có đánh giá</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="p-3 font-medium">Đơn hàng</th>
                  <th className="p-3 font-medium">Điểm</th>
                  <th className="p-3 font-medium">Nhận xét</th>
                  <th className="p-3 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="p-3 text-white text-sm">{r.orderId}</td>
                    <td className="p-3 text-white text-sm">
                      {'★'.repeat(r.rating || 0)}
                      {'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))} ({r.rating}/5)
                    </td>
                    <td className="p-3 text-gray-300 text-sm">{r.comment || '—'}</td>
                    <td className="p-3 text-gray-400 text-sm">{formatDate(r.createdAt)}</td>
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

