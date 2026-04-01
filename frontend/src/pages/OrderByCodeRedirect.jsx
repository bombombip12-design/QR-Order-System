import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

/** Mở /order/T1 (giống orderUrl) → chuyển vào /table/:id */
export default function OrderByCodeRedirect() {
  const { code } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!code) {
      navigate('/scan', { replace: true })
      return
    }
    const c = encodeURIComponent(code)
    fetch(`/api/tables/by-code/${c}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((t) => navigate(`/table/${t.tableNumber}`, { replace: true }))
      .catch(() => navigate('/scan', { replace: true }))
  }, [code, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-gray-400">
      Đang mở bàn…
    </div>
  )
}

