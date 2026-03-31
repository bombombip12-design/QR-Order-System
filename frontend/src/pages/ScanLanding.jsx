import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QrCode } from 'lucide-react'

export default function ScanLanding() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tableId = searchParams.get('table')

  useEffect(() => {
    if (tableId) {
      navigate(`/table/${tableId}`, { replace: true })
      return
    }
  }, [tableId, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6">
          <QrCode className="w-10 h-10 text-brand-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Food Order by QR</h1>
        <p className="text-gray-400 mb-6">
          Quét mã QR tại bàn của bạn để mở menu và đặt món.
        </p>
        <p className="text-sm text-gray-500">
          Không có mã QR? Thử truy cập: <br />
          <code className="text-brand-400">/table/[số bàn]</code>
        </p>
        <div className="mt-8 flex flex-col gap-3 items-center">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/table/demo')}
              className="btn-primary"
            >
              Vào bàn demo
            </button>
            <button type="button" onClick={() => navigate('/login')} className="btn-secondary">
              Đăng nhập nhân viên
            </button>
          </div>
          <p className="text-xs text-gray-600 max-w-sm">
            Một trang đăng nhập chung: sau khi nhập tài khoản, bạn được chuyển tới khu quản lý, phục vụ hoặc bếp tùy vai trò.
          </p>
        </div>
      </div>
    </div>
  )
}

