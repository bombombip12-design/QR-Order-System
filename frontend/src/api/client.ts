import type { Category, MenuItem, Table, Order, OrderStatus, Call, User, PaymentMethod, Rating, Complaint, PaymentInstructions } from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json()
}

export const categoriesApi = {
  list: () => request<{ categories: Category[] }>('/categories').then((r) => r.categories),
}

export const menuApi = {
  list: (categoryId?: string) =>
    request<{ items: MenuItem[] }>(
      categoryId ? `/menu?category=${categoryId}` : '/menu'
    ).then((r) => r.items),
  get: (id: string) => request<MenuItem>(`/menu/${id}`),
}

export const tablesApi = {
  list: () => request<{ tables: Table[] }>('/tables').then((r) => r.tables),
  get: (id: string) => request<Table>(`/tables/${id}`),
  update: (id: string, data: Partial<Table>) =>
    request<{ table: Table }>(`/tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then((r) => r.table),
}

export const ordersApi = {
  byTable: (tableId: string) =>
    request<{ orders: Order[] }>(`/orders?table=${tableId}`).then((r) => r.orders),
  create: (tableId: string, items: { menuItem: string; quantity: number; note?: string }[]) =>
    request<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ table: tableId, items }),
    }),
  updateStatus: (orderId: string, status: OrderStatus) =>
    request<{ order: Order }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (orderId: string) =>
    request<void>(`/orders/${orderId}`, {
      method: 'DELETE',
    }),
  listAll: () => request<{ orders: Order[] }>('/orders').then((r) => r.orders),
  listByStatus: (status: string) =>
    request<Order[]>(`/orders?status=${encodeURIComponent(status)}`),
  historyPaid: () => request<Order[]>('/orders/history'),
  getById: (id: string) => request<Order>(`/orders/${id}`),
  update: (id: string, items: { menuItem: string; quantity: number; note?: string }[]) =>
    request<{ order: Order }>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }).then((r) => r.order),
  requestPayment: (id: string, method?: 'cash' | 'momo' | 'bank_transfer') =>
    request<{ order: Order }>(`/orders/${id}/payment-request`, {
      method: 'PATCH',
      body: JSON.stringify(method ? { method } : {}),
    }).then((r) => r.order),
}

export const callsApi = {
  create: (tableId: string, type: 'staff' | 'payment') =>
    request<{ call: Call }>('/calls', {
      method: 'POST',
      body: JSON.stringify({ table: tableId, type }),
    }),
  list: (tableId?: string) =>
    request<{ calls: Call[] }>(
      tableId ? `/calls?table=${tableId}` : '/calls'
    ).then((r) => r.calls),
  handle: (callId: string) =>
    request<{ call: Call }>(`/calls/${callId}/handle`, { method: 'PATCH' }),
}

export const paymentApi = {
  confirm: (orderId: string, method?: string) =>
    request<{ order: Order }>(`/orders/${orderId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(method ? { method } : {}),
    }),
  updateMethod: (orderId: string, method: 'cash' | 'momo' | 'bank_transfer') =>
    request<{ order: Order }>(`/orders/${orderId}/payment-method`, {
      method: 'PATCH',
      body: JSON.stringify({ method }),
    }),
  instructions: () => request<PaymentInstructions>('/payment-instructions'),
}

export const feedbackApi = {
  submitRating: (orderId: string, data: { rating: number; comment?: string }) =>
    request(`/orders/${orderId}/rating`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitComplaint: (orderId: string, data: { content: string }) =>
    request(`/orders/${orderId}/complaint`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const adminApi = {
  categories: {
    list: () => request<{ categories: Category[] }>('/admin/categories').then((r) => r.categories),
    create: (data: { name: string; description?: string }) =>
      request<{ category: Category }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Category>) =>
      request<{ category: Category }>(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
  },
  menu: {
    list: () => request<{ items: MenuItem[] }>('/admin/menu').then((r) => r.items),
    create: (data: Partial<MenuItem> & { name: string; price: number; category: string }) =>
      request<{ item: MenuItem }>('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<MenuItem>) =>
      request<{ item: MenuItem }>(`/admin/menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/admin/menu/${id}`, { method: 'DELETE' }),
    uploadImage: (file: File) => {
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
        return res.json() as Promise<{ url: string }>
      })
    },
  },
  tables: {
    list: () => request<{ tables: Table[] }>('/admin/tables').then((r) => r.tables),
    create: (data: { name: string; capacity?: number; orderUrl?: string }) =>
      request<{ table: Table }>('/admin/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Table>) =>
      request<{ table: Table }>(`/admin/tables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/admin/tables/${id}`, { method: 'DELETE' }),
  },
  users: {
    list: () => request<{ users: User[] }>('/admin/users').then((r) => r.users),
    create: (data: { name: string; email: string; phone: string; password: string; role: 'waiter' | 'kitchen' | 'admin' }) =>
      request<{ user: User }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>) =>
      request<{ user: User }>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: (params?: { table?: string; status?: string; paymentStatus?: string }) => {
      const search = new URLSearchParams()
      if (params?.table) search.set('table', params.table)
      if (params?.status) search.set('status', params.status)
      if (params?.paymentStatus) search.set('paymentStatus', params.paymentStatus)
      const query = search.toString()
      return request<{ orders: Order[] }>(`/admin/orders${query ? `?${query}` : ''}`).then((r) => r.orders)
    },
    get: (id: string) => request<{ order: Order }>(`/admin/orders/${id}`).then((r) => r.order),
    updateStatus: (id: string, status: OrderStatus) =>
      request<{ order: Order }>(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }).then((r) => r.order),
  },
  stats: {
    get: () =>
      request<{
        revenue: number
        totalOrders: number
        topItems: { name: string; quantity: number }[]
      }>('/admin/stats'),
  },

  paymentMethods: {
    list: () => request<PaymentMethod[]>('/admin/payment-methods'),
    create: (data: { name: string; active?: boolean }) =>
      request<{ method: { id: string; name: string; active: boolean } }>('/admin/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ ...data, active: data.active ?? true }),
      }),
    update: (id: string, data: { name: string; active?: boolean }) =>
      request<{ method: { id: string; name: string; active: boolean } }>(`/admin/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, active: data.active }),
      }),
    patchActive: (id: string, active: boolean) =>
      request<{ method: { id: string; name: string; active: boolean } }>(`/admin/payment-methods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
  },

  ratings: {
    list: () => request<Rating[]>('/admin/ratings'),
  },

  complaints: {
    list: () => request<Complaint[]>('/admin/complaints'),
    resolve: (id: string, note: string) =>
      request<{ complaint: Complaint }>(`/admin/complaints/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }),
  },
}

