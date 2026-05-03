import { useEffect, useState } from 'react'
import { getProducts, createSale } from '../api'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react'

export default function NewSale() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [cart, setCart] = useState([]) // [{ product, quantity }]
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(products.map((p) => p.category_name).filter(Boolean))].sort()

  const inStockProducts = products.filter((p) => p.quantity > 0)
  const filtered = inStockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || p.category_name === filterCategory
    return matchSearch && matchCat
  })

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) return prev
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i
          const newQty = i.quantity + delta
          if (newQty <= 0) return null
          if (newQty > i.product.quantity) return i
          return { ...i, quantity: newQty }
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  const handleSubmit = async () => {
    if (cart.length === 0) return
    setError('')
    setSubmitting(true)
    try {
      const sale = await createSale({
        items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        note: note.trim() || undefined,
      })
      setSuccess(sale)
      setCart([])
      setNote('')
      // Refresh products to reflect updated stock levels
      const updated = await getProducts()
      setProducts(updated)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete sale')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ── Left: Product Browser ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 pb-4 bg-white border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">New Sale</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const inCart = cart.find((i) => i.product.id === p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-white rounded-xl p-4 text-left shadow-sm border transition-all hover:shadow-md active:scale-95 ${
                    inCart
                      ? 'border-orange-400 ring-2 ring-orange-200'
                      : 'border-gray-100 hover:border-orange-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-tight mb-1">{p.name}</p>
                  <p className="text-xs text-gray-400 mb-3">{p.category_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-bold">₱{p.price.toFixed(2)}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.quantity <= 10
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {p.quantity} left
                    </span>
                  </div>
                  {inCart && (
                    <div className="mt-2 bg-orange-500 text-white text-xs font-medium text-center py-1 rounded-lg">
                      In cart: {inCart.quantity}
                    </div>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                No in-stock products found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Cart ───────────────────────────────────────────────────── */}
      <div className="w-80 bg-white border-l border-gray-100 flex flex-col shadow-lg flex-shrink-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800">Cart</h3>
            {cart.length > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3 py-12">
              <ShoppingCart className="w-12 h-12" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs text-center px-6">Tap a product on the left to add it</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{product.name}</p>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        disabled={quantity >= product.quantity}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      ₱{(product.price * quantity).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ₱{product.price.toFixed(2)} × {quantity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart footer */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-800">₱{total.toFixed(2)}</span>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-md shadow-orange-200 disabled:shadow-none"
          >
            {submitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {/* ── Success Modal ─────────────────────────────────────────────────── */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Sale Complete!</h3>
            <p className="text-gray-500 text-sm mb-2">Sale #{success.id} processed successfully</p>
            <p className="text-3xl font-bold text-orange-600 mb-6">₱{success.total.toFixed(2)}</p>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 text-sm divide-y divide-gray-100 max-h-48 overflow-auto">
              {success.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <span className="text-gray-600">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-gray-800">₱{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {success.note && (
              <p className="text-xs text-gray-400 mb-4 italic">"{success.note}"</p>
            )}

            <button
              onClick={() => setSuccess(null)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
