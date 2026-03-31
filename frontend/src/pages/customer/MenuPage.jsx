import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { categoriesApi, menuApi } from '../../api/client'

export default function MenuPage() {
  const { tableId } = useParams()
  const { addItem } = useCart()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('category')

  useEffect(() => {
    Promise.all([categoriesApi.list(), menuApi.list()])
      .then(([cats, allItems]) => {
        setCategories(cats)
        setItems(allItems)
      })
      .catch(() => {
        setCategories([])
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredItems = items
    .filter((m) => {
      if (!selectedCategory) return true
      return (typeof m.category === 'object' ? m.category?._id : m.category) === selectedCategory
    })
    .filter((m) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      const name = m.name?.toLowerCase() || ''
      const desc = m.description?.toLowerCase() || ''
      return name.includes(q) || desc.includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi')
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'vi')
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price

      const aCat = typeof a.category === 'object' && a.category?.name ? a.category.name : ''
      const bCat = typeof b.category === 'object' && b.category?.name ? b.category.name : ''
      const catCompare = aCat.localeCompare(bCat, 'vi')
      if (catCompare !== 0) return catCompare
      return a.name.localeCompare(b.name, 'vi')
    })

  const handleAdd = (item) => {
    addItem(item)
  }

  if (!tableId) return null
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Đang tải menu...</div>
      </div>
    )
  }

  return (
    <div>
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory == null
                ? 'bg-brand-500 text-white'
                : 'bg-surface-card text-gray-400 hover:text-white border border-gray-600'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setSelectedCategory(c._id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c._id
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-card text-gray-400 hover:text-white border border-gray-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm món theo tên hoặc mô tả..."
          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-gray-600 text-white placeholder-gray-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-gray-600 text-white"
        >
          <option value="category">Sắp xếp theo danh mục</option>
          <option value="name-asc">Tên A-Z</option>
          <option value="name-desc">Tên Z-A</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <UtensilsCrossed className="w-12 h-12 mb-3 opacity-50" />
          <p>Chưa có món nào trong danh mục này.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div key={item._id} className="card p-4 flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-surface-elevated flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{item.name}</h3>
                {item.description && <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{item.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-brand-400 font-semibold">{item.price.toLocaleString('vi-VN')}₫</span>
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

