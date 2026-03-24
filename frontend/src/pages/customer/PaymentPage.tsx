import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { callsApi, feedbackApi, ordersApi, paymentApi } from '../../api/client'
import type { Order, PaymentInstructions } from '../../types'

export default function PaymentPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'momo' | 'bank'>('momo')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [ratingModalOrderId, setRatingModalOrderId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  useEffect(() => {
    paymentApi.instructions().then(setInstructions).catch(() => setInstructions(null))
  }, [])

  const loadOrders = () => {
    if (!tableId) return Promise.resolve()
    return ordersApi
      .byTable(tableId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [tableId])

  const activeUnpaidOrder = orders.find((order) => order.status !== 'cancelled' && order.paymentStatus !== 'paid')

  const refreshOrders = async () => {
    if (!tableId) return
    const latest = await ordersApi.byTable(tableId)
    setOrders(latest)
  }

  const handleConfirmPayment = async () => {
    if (!activeUnpaidOrder) return
    const orderId = activeUnpaidOrder._id
    if (activeUnpaidOrder.paymentStatus === 'requested') {
      // Allow customer to open rating modal even if request was already sent before.
      setRatingModalOrderId(orderId)
      setRating(5)
      setComment('')
      setRatingDone(false)
      setRatingError(null)
      return
    }

    setPaying(true)
    try {
      // Try to mark request state when backend supports it.
      // If route is not available yet (404), continue with call notification.
      await ordersApi
        .requestPayment(orderId, selectedMethod === 'momo' ? 'momo' : 'bank_transfer')
        .catch(() => undefined)
      if (tableId) await callsApi.create(tableId, 'payment')
      await refreshOrders()
      alert('Đã gửi yêu cầu thanh toán cho nhân viên. Vui lòng chờ xác nhận.')
      setRatingModalOrderId(orderId)
      setRating(5)
      setComment('')
      setRatingDone(false)
      setRatingError(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gửi yêu cầu thanh toán thất bại')
    } finally {
      setPaying(false)
    }
  }

  const submitRating = async () => {
    if (!ratingModalOrderId) return
    setRatingSubmitting(true)
    setRatingError(null)
    try {
      await feedbackApi.submitRating(ratingModalOrderId, { rating, comment })
      setRatingDone(true)
    } catch (e) {
      setRatingError(e instanceof Error ? e.message : 'Gửi đánh giá thất bại')
    } finally {
      setRatingSubmitting(false)
    }
  }

  if (!tableId) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Đang tải thông tin thanh toán...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeUnpaidOrder && (
        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-2">Đơn cần thanh toán</p>
          <p className="text-white font-medium">
            Tổng: {(activeUnpaidOrder.totalAmount || 0).toLocaleString('vi-VN')}₫
          </p>
        </div>
      )}

      <div className="card p-4 space-y-3">
        <p className="text-sm font-medium text-white">Chọn phương thức</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedMethod('momo')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border ${
              selectedMethod === 'momo'
                ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                : 'border-gray-700 bg-surface-elevated text-gray-300'
            }`}
          >
            Momo
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('bank')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border ${
              selectedMethod === 'bank'
                ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                : 'border-gray-700 bg-surface-elevated text-gray-300'
            }`}
          >
            Chuyển khoản ngân hàng
          </button>
        </div>
      </div>

      {selectedMethod === 'momo' ? (
        <div className="card p-4 space-y-2">
          <p className="text-sm text-gray-300">Quét mã QR Momo của quán:</p>
          {instructions?.momo?.qrImageUrl ? (
            <img
              src={instructions.momo.qrImageUrl}
              alt="Momo QR"
              className="w-56 max-w-full rounded-lg border border-gray-700"
            />
          ) : (
            <p className="text-sm text-yellow-400">Chưa cấu hình ảnh QR Momo.</p>
          )}
          {instructions?.momo?.accountName && (
            <p className="text-sm text-gray-400">Tên ví: {instructions.momo.accountName}</p>
          )}
          {instructions?.momo?.accountNumber && (
            <p className="text-sm text-gray-400">SĐT ví: {instructions.momo.accountNumber}</p>
          )}
        </div>
      ) : (
        <div className="card p-4 space-y-1 text-sm">
          <p className="text-gray-300">
            Ngân hàng: <span className="text-white">{instructions?.bank?.bankName || 'Chưa cấu hình'}</span>
          </p>
          <p className="text-gray-300">
            Chủ tài khoản: <span className="text-white">{instructions?.bank?.accountName || 'Chưa cấu hình'}</span>
          </p>
          <p className="text-gray-300">
            Số tài khoản:{' '}
            <span className="text-white">{instructions?.bank?.accountNumber || 'Chưa cấu hình'}</span>
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirmPayment}
        disabled={paying || !activeUnpaidOrder}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {paying
          ? 'Đang gửi yêu cầu...'
          : activeUnpaidOrder?.paymentStatus === 'requested'
            ? 'Đã gửi yêu cầu thanh toán (Bấm để đánh giá)'
            : 'Tôi đã thanh toán'}
      </button>

      {ratingModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card border border-gray-700 p-4 space-y-3">
            <h3 className="text-white font-semibold">Đánh giá trải nghiệm</h3>
            {ratingDone ? (
              <div className="space-y-3">
                <p className="text-sm text-green-400">Đã gửi đánh giá. Cảm ơn bạn!</p>
                <button
                  type="button"
                  onClick={() => setRatingModalOrderId(null)}
                  className="btn-primary w-full py-2"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="text-2xl leading-none"
                      style={{ color: rating >= s ? 'rgb(251, 191, 36)' : 'rgb(148, 163, 184)' }}
                    >
                      {rating >= s ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Nhận xét (tùy chọn)"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
                />
                {ratingError && <p className="text-sm text-red-400">{ratingError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRatingModalOrderId(null)}
                    className="btn-secondary flex-1 py-2"
                  >
                    Để sau
                  </button>
                  <button
                    type="button"
                    onClick={submitRating}
                    disabled={ratingSubmitting}
                    className="btn-primary flex-1 py-2"
                  >
                    {ratingSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
