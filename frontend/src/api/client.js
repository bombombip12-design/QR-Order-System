/**
 * Client gọi API HTTP tới cùng origin (/api → proxy Vite tới server Node, hoặc reverse proxy production).
 * Phần adminApi khớp với Backend/routes/adminRoutes.js (GET/POST/PATCH/DELETE dưới /api/admin/...).
 */
const BASE = '/api'

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined
  }

  return res.json()
}

export const categoriesApi = {
  list: () => request('/categories').then((r) => r.categories),
}

export const menuApi = {
  list: (categoryId) =>
    request(categoryId ? `/menu?category=${categoryId}` : '/menu').then((r) => r.items),
  get: (id) => request(`/menu/${id}`),
}

export const tablesApi = {
  list: () => request('/tables').then((r) => r.tables),
  get: (id) => request(`/tables/${id}`),
  update: (id, data) =>
    request(`/tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then((r) => r.table),
}

export const ordersApi = {
  byTable: (tableId) => request(`/orders?table=${tableId}`).then((r) => r.orders),
  create: (tableId, items) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify({ table: tableId, items }),
    }),
  updateStatus: (orderId, status) =>
    request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((r) => r.order),
  delete: (orderId) =>
    request(`/orders/${orderId}`, {
      method: 'DELETE',
    }),
  listAll: () => request('/orders').then((r) => r.orders),
  listByStatus: (status) => request(`/orders?status=${encodeURIComponent(status)}`),
  historyPaid: () => request('/orders/history'),
  getById: (id) => request(`/orders/${id}`),
  update: (id, items) =>
    request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }).then((r) => r.order),
  requestPayment: (id, method) =>
    request(`/orders/${id}/payment-request`, {
      method: 'PATCH',
      body: JSON.stringify(method ? { method } : {}),
    }).then((r) => r.order),
}

export const callsApi = {
  create: (tableId, type) =>
    request('/calls', {
      method: 'POST',
      body: JSON.stringify({ table: tableId, type }),
    }),
  list: (tableId) =>
    request(tableId ? `/calls?table=${tableId}` : '/calls').then((r) => r.calls),
  handle: (callId) => request(`/calls/${callId}/handle`, { method: 'PATCH' }),
}

export const paymentApi = {
  confirm: (orderId, method) =>
    request(`/orders/${orderId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(method ? { method } : {}),
    }),
  updateMethod: (orderId, method) =>
    request(`/orders/${orderId}/payment-method`, {
      method: 'PATCH',
      body: JSON.stringify({ method }),
    }),
  instructions: () => request('/payment-instructions'),
}

export const feedbackApi = {
  submitRating: (orderId, data) =>
    request(`/orders/${orderId}/rating`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

/** CRUD danh mục, món, bàn, nhân viên; xem/sửa đơn; thống kê; phương thức thanh toán; danh sách đánh giá */
export const adminApi = {
  categories: {
    list: () => request('/admin/categories').then((r) => r.categories),
    create: (data) =>
      request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
  },

  menu: {
    // Duoc AdminMenu.jsx su dung cho CRUD mon an.
    // Anh mon an upload rieng qua /admin/upload, sau do URL tra ve duoc gui kem payload create/update.
    list: () => request('/admin/menu').then((r) => r.items),
    create: (data) =>
      request('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/admin/menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/admin/menu/${id}`, { method: 'DELETE' }),
    uploadImage: (file) => {
      const form = new FormData()
      form.append('image', file)

      return fetch(`${BASE}/admin/upload`, {
        method: 'POST',
        body: form,
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }))
          throw new Error(err.message || 'Upload failed')
        }
        return res.json()
      })
    },
  },

  tables: {
    list: () => request('/admin/tables').then((r) => r.tables),
    create: (data) =>
      request('/admin/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/admin/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/admin/tables/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: () => request('/admin/users').then((r) => r.users),
    create: (data) =>
      request('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  },

  orders: {
    // AdminOrders.jsx dung nhom API nay de:
    // - list: lay danh sach don theo bo loc
    // - get: lay chi tiet 1 don
    // - updateStatus: doi trang thai don
    list: (params) => {
      const search = new URLSearchParams()
      if (params?.table) search.set('table', params.table)
      if (params?.status) search.set('status', params.status)
      if (params?.paymentStatus) search.set('paymentStatus', params.paymentStatus)
      const query = search.toString()
      return request(`/admin/orders${query ? `?${query}` : ''}`).then((r) => r.orders)
    },
    get: (id) => request(`/admin/orders/${id}`).then((r) => r.order),
    updateStatus: (id, status) =>
      request(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }).then((r) => r.order),
  },

  // AdminStats.jsx: lay tong hop doanh thu, so don, top 5 mon ban chay.
  stats: {
    get: () => request('/admin/stats'),
  },

  paymentMethods: {
    list: () => request('/admin/payment-methods'),
    create: (data) =>
      request('/admin/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ ...data, active: data.active ?? true }),
      }),
    update: (id, data) =>
      request(`/admin/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, active: data.active }),
      }),
    patchActive: (id, active) =>
      request(`/admin/payment-methods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
  },

  ratings: {
    list: () => request('/admin/ratings'),
    delete: (id) => request(`/admin/ratings/${id}`, { method: 'DELETE' }),
  },
}

