import { useEffect, useState, useRef } from 'react'
import { Plus, Pencil, Trash2, ImageIcon } from 'lucide-react'
import { adminApi } from '../../api/client'

export default function AdminMenu() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const load = () => {
    // Luong khoi tao trang Mon an:
    // goi song song danh sach mon + danh muc, sau do bind vao state de render form/list.
    Promise.all([adminApi.menu.list(), adminApi.categories.list()])
      .then(([menuList, catList]) => {
        setItems(menuList)
        setCategories(catList)
        if (catList.length && !categoryId) setCategoryId(catList[0]._id)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // Chay 1 lan khi vao man hinh Admin > Mon an.
    load()
  }, [])

  const openCreate = () => {
    // Bat dau che do tao mon moi: reset toan bo form.
    setMessage(null)
    setCreating(true)
    setEditing(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId(categories[0]?._id ?? '')
    setImageUrl('')
  }

  const openEdit = (m) => {
    // Bat dau che do sua: do thong tin mon hien tai len form.
    setMessage(null)
    setEditing(m)
    setCreating(false)
    setName(m.name)
    setDescription(m.description ?? '')
    setPrice(String(m.price))
    setCategoryId(typeof m.category === 'object' ? m.category._id : m.category)
    setImageUrl(m.image ?? '')
  }

  const handleImageChange = async (e) => {
    // Upload anh len /api/admin/upload, nhan ve URL va gan vao imageUrl.
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const { url } = await adminApi.menu.uploadImage(file)
      setImageUrl(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi tải ảnh')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = () => setImageUrl('')

  const save = async () => {
    // Ham luu chinh:
    // - Neu editing: PATCH /api/admin/menu/:id
    // - Neu creating: POST /api/admin/menu
    // Sau khi thanh cong se goi load() de dong bo UI voi DB.
    if (!name.trim() || !price.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên món và giá.' })
      return
    }
    const numPrice = Number(price)
    if (Number.isNaN(numPrice) || numPrice < 0) {
      setMessage({ type: 'error', text: 'Giá món ăn không được âm.' })
      return
    }
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: numPrice,
        category: categoryId,
        ...(imageUrl ? { image: imageUrl } : {}),
      }
      if (editing) {
        await adminApi.menu.update(editing._id, payload)
        setEditing(null)
        setMessage({ type: 'success', text: 'Cập nhật món ăn thành công.' })
      } else if (creating) {
        await adminApi.menu.create(payload)
        setCreating(false)
        setMessage({ type: 'success', text: 'Thêm món ăn thành công.' })
      }
      setName('')
      setDescription('')
      setPrice('')
      setImageUrl('')
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lỗi khi lưu món ăn.' })
    }
  }

  const remove = async () => {
    // Xoa mon: DELETE /api/admin/menu/:id, xong tai lai danh sach.
    if (!confirmDeleteId) return
    try {
      await adminApi.menu.delete(confirmDeleteId)
      setMessage({ type: 'success', text: 'Xóa món ăn thành công.' })
      setConfirmDeleteId(null)
      load()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Xóa món ăn thất bại.' })
    }
  }

  if (loading) {
    return <div className="text-gray-400 py-8">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`card p-3 text-sm border flex justify-between items-center ${
            message.type === 'success' ? 'text-green-300 border-green-500/40' : 'text-red-300 border-red-500/40'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-gray-300">
            Đóng
          </button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Món ăn</h2>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm món
        </button>
      </div>

      {(creating || editing) && (
        <div className="card p-4 space-y-3">
          <input
            type="text"
            placeholder="Tên món"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <input
            type="text"
            placeholder="Mô tả (tùy chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <input
            type="number"
            min={0}
            placeholder="Giá (VNĐ)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white placeholder-gray-500"
          />
          <div>
            <p className="text-sm text-gray-400 mb-1">Ảnh món ăn (tùy chọn)</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {imageUrl ? (
              <div className="flex items-center gap-3 mt-1">
                <img src={imageUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-600" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm text-brand-400 hover:underline disabled:opacity-50"
                  >
                    {uploading ? 'Đang tải...' : 'Đổi ảnh'}
                  </button>
                  <button type="button" onClick={removeImage} className="text-sm text-red-400 hover:underline">
                    Xóa ảnh
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-gray-400 hover:text-white border-dashed"
              >
                <ImageIcon className="w-5 h-5" />
                {uploading ? 'Đang tải ảnh...' : 'Chọn ảnh món ăn'}
              </button>
            )}
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-surface-elevated border border-gray-600 text-white"
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={save} className="btn-primary">
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setEditing(null)
                setName('')
                setDescription('')
                setPrice('')
                setImageUrl('')
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((m) => (
          <li key={m._id} className="card p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {m.image ? (
                <img src={m.image} alt={m.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-surface-elevated" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0 text-gray-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-white">{m.name}</p>
                {m.description && <p className="text-sm text-gray-400 truncate">{m.description}</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={() => openEdit(m)} className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setConfirmDeleteId(m._id)} className="p-2 rounded-lg bg-surface-elevated text-red-400 hover:bg-red-500/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 && !creating && <p className="text-gray-400 text-center py-8">Chưa có món ăn.</p>}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface-card border border-gray-700 p-4 space-y-4">
            <h3 className="text-white font-semibold">Xác nhận xóa món</h3>
            <p className="text-sm text-gray-300">Bạn có chắc muốn xóa món này không?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-lg bg-surface-elevated text-gray-200 hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={remove}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
              >
                Xóa món
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

