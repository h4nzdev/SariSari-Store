import { useEffect, useState } from 'react'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api'
import { Plus, Edit, Trash2, Search, AlertTriangle, X, Camera } from 'lucide-react'
import CameraOCR from '../components/CameraOCR'

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    category_id: product?.category_id ?? '',
    price: product?.price ?? '',
    quantity: product?.quantity ?? '',
    unit: product?.unit ?? 'piece',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="font-bold text-lg text-gray-800">
              {product ? 'Edit Product' : 'Add Product'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                {error}
              </p>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors font-medium"
                  title="Scan product label with camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Scan Label
                </button>
              </div>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Lucky Me Chicken Noodle"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={set('category_id')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₱) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="0.00"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={set('quantity')}
                  placeholder="0"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={set('unit')}
                placeholder="piece, pack, bottle, sachet, kilo..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera OCR — z-[60] so it renders above the modal */}
      {cameraOpen && (
        <CameraOCR
          onTextSelect={(text) => setForm((f) => ({ ...f, name: text }))}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </>
  )
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteConfirmModal({ product, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Delete Product?</h3>
        <p className="text-gray-500 text-sm mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-800">{product.name}</span>? This action cannot
          be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Products Page ─────────────────────────────────────────────────────────────

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | product object for edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [errorBanner, setErrorBanner] = useState('')

  const load = async () => {
    const [prods, cats] = await Promise.all([getProducts(), getCategories()])
    setProducts(prods)
    setCategories(cats)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || String(p.category_id) === filterCategory
    return matchSearch && matchCat
  })

  const handleSave = async (form) => {
    if (modal === 'add') {
      await createProduct(form)
    } else {
      await updateProduct(modal.id, form)
    }
    await load()
  }

  const handleDelete = async () => {
    try {
      setErrorBanner('')
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setErrorBanner(err.response?.data?.error || 'Failed to delete product')
      setDeleteTarget(null)
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Products</h2>
          <p className="text-gray-500 text-sm mt-1">{products.length} total products</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-orange-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {errorBanner && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorBanner}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Product</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Category</th>
              <th className="text-right px-6 py-3 text-xs text-gray-500 font-medium">Price</th>
              <th className="text-right px-6 py-3 text-xs text-gray-500 font-medium">Qty</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Unit</th>
              <th className="text-right px-6 py-3 text-xs text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    p.quantity === 0
                      ? 'bg-red-50/40 hover:bg-red-50'
                      : p.quantity <= 10
                      ? 'bg-amber-50/40 hover:bg-amber-50'
                      : 'hover:bg-orange-50/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      {p.quantity === 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Out of stock
                        </span>
                      )}
                      {p.quantity > 0 && p.quantity <= 10 && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                          Low stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.category_name || '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-right">
                    ₱{p.price.toFixed(2)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-bold text-right ${
                      p.quantity === 0
                        ? 'text-red-600'
                        : p.quantity <= 10
                        ? 'text-amber-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {p.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.unit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal(p)}
                        className="p-2 hover:bg-orange-100 text-orange-500 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-2 hover:bg-red-100 text-red-400 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
