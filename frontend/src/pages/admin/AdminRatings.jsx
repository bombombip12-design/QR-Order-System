import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { adminApi } from '../../api/client'

export default function AdminRatings() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadList = () => {
    setLoading(true)
    adminApi.ratings
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadList()
  }, [])

  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—')

  const remove = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    setMessage(null)
    try {
      await adminApi.ratings.delete(confirmDeleteId)
      setConfirmDeleteId(null)
      setMessage({ type: 'success', text: 'Đã xóa đánh giá.' })
      setList((prev) => prev.filter((r) => r.id !== confirmDeleteId))
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xóa đánh giá thất bại.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Đánh giá của khách hàng</h2>

      {message && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

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
                  <th className="p-3 font-medium w-24">Thao tác</th>
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
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null)
                          setConfirmDeleteId(r.id)
                        }}
                        className="p-2 rounded-lg bg-surface-elevated text-red-400 hover:bg-red-500/20"
                        title="Xóa đánh giá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận xóa đánh giá</h3>
            <p className="text-sm text-gray-300">Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-lg bg-surface-elevated text-gray-200 hover:bg-gray-600 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={remove}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
