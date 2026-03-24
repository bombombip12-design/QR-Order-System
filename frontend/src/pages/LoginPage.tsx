import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AUTH_TOKEN_KEY } from '../utils/auth'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading
  }, [email, password, loading])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        // backend thường trả JSON { message }, nhưng vẫn fallback sang text để hiển thị cho chắc
        const payload = await res.json().catch(() => null)
        const text = payload?.message || (await res.text().catch(() => ''))
        throw new Error(text || 'Đăng nhập thất bại')
      }

      const data = await res.json()
      if (!data?.token) throw new Error('Backend không trả token')

      localStorage.setItem(AUTH_TOKEN_KEY, data.token)

      const role = data?.user?.role as string | undefined
      if (role === 'admin' || role === 'manager') navigate('/admin', { replace: true })
      else if (role === 'waiter' || role === 'staff') navigate('/staff', { replace: true })
      else if (role === 'kitchen') navigate('/kitchen', { replace: true })
      else {
        // role lạ: quay lại trang login để tránh bị kẹt trang
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setError('Role không hợp lệ: không thể chuyển tới trang phù hợp')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="card p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-white mb-6">Đăng nhập</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              className="w-full bg-surface-elevated border border-gray-600 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Mật khẩu</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="w-full bg-surface-elevated border border-gray-600 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500"
            />
          </div>

          {error ? <div className="text-sm text-red-400">{error}</div> : null}

          <button type="submit" className="btn-primary w-full" disabled={!canSubmit}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}

