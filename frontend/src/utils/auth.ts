import type { NavigateFunction } from 'react-router-dom'

export const AUTH_TOKEN_KEY = 'auth_token'

/** Xóa JWT và chuyển về trang đăng nhập (JWT không cần gọi API logout server). */
export function logout(navigate: NavigateFunction) {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  navigate('/login', { replace: true })
}
