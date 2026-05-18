import { useEffect, useState, useCallback } from 'react'
import { getProducts, createSale, getPinnedIds, togglePin, getUtang, createUtangCustomer, addUtangEntry } from '../api'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Star, Printer, X, UserPlus } from 'lucide-react'

const DENOMINATIONS = [20, 50, 100, 200, 500, 1000]

function printReceipt(sale) {
  const settings = JSON.parse(localStorage.getItem('sari_settings') || '{}')
  const storeName = settings.store_name || 'Sari-Sari Store'
  const ownerName = settings.owner_name || ''
  const dateStr = new Date(sale.created_at.replace(' ', 'T')).toLocaleString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const win = window.open('', '_blank', 'width=380,height=650')
  win.document.write(`<!DOCTYPE html><html><head><title>Receipt #${sale.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px 16px; max-width: 300px; margin: 0 auto; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #aaa; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .row .right { text-align: right; flex-shrink: 0; }
    .total-row { font-size: 14px; font-weight: bold; margin-top: 4px; }
    .small { font-size: 10px; color: #555; }
    .mt8 { margin-top: 8px; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <div class="center bold" style="font-size:15px;">${storeName}</div>
  ${ownerName ? `<div class="center small">${ownerName}</div>` : ''}
  <div class="center small mt8">${dateStr}</div>
  <div class="center small">Receipt #${sale.id}</div>
  <div class="divider"></div>
  ${sale.items.map((item) => `
    <div class="bold" style="font-size:11px;">${item.product_name}</div>
    <div class="row small">
      <span>${item.quantity} × ₱${item.price.toFixed(2)}</span>
      <span class="right">₱${item.subtotal.toFixed(2)}</span>
    </div>`).join('')}
  <div class="divider"></div>
  <div class="row total-row"><span>TOTAL</span><span class="right">₱${sale.total.toFixed(2)}</span></div>
  ${sale._cashGiven > 0 ? `
    <div class="row mt8"><span>Cash</span><span class="right">₱${sale._cashGiven.toFixed(2)}</span></div>
    <div class="row bold"><span>Change</span><span class="right">₱${(sale._cashGiven - sale.total).toFixed(2)}</span></div>
  ` : ''}
  ${sale._utangAmount > 0 ? `
    <div class="row mt8 bold" style="color:#dc2626;"><span>Utang (${sale._utangName})</span><span class="right">₱${sale._utangAmount.toFixed(2)}</span></div>
  ` : ''}
  ${sale.note ? `<div class="divider"></div><div class="center small">Note: ${sale.note}</div>` : ''}
  <div class="divider"></div>
  <div class="center small">Salamat sa inyong pagbili!</div>
  <div class="center small">Thank you for your purchase!</div>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

function CheckoutModal({ total, cart, note, onConfirm, onClose }) {
  const [cash, setCash] = useState('')
  const [utangCustomers, setUtangCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const cashNum = parseFloat(cash) || 0
  const diff = cashNum - total
  const isShort = cashNum > 0 && diff < 0
  const hasChange = cashNum > 0 && diff >= 0
  const shortAmount = Math.abs(diff)

  useEffect(() => {
    getUtang().then((customers) => {
      setUtangCustomers(customers.filter((c) => true))
    })
  }, [])

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) return
    setAddingCustomer(true)
    try {
      const c = await createUtangCustomer(newCustomerName.trim())
      setUtangCustomers((prev) => [...prev, c])
      setSelectedCustomer(String(c.id))
      setNewCustomerName('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer')
    } finally {
      setAddingCustomer(false)
    }
  }

  const handleConfirm = async () => {
    setError('')
    setSubmitting(true)
    try {
      let utangInfo = null

      if (isShort && selectedCustomer) {
        utangInfo = {
          customerId: selectedCustomer,
          amount: shortAmount,
          customerName: utangCustomers.find((c) => String(c.id) === selectedCustomer)?.customer_name || '',
        }
      }

      await onConfirm({ cashGiven: cashNum, utangInfo })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete sale')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg text-gray-800">Checkout</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 max-h-40 overflow-auto">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{product.name} × {quantity}</span>
                <span className="font-medium text-gray-800">₱{(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Due</span>
            <span className="text-3xl font-bold text-gray-900">₱{total.toFixed(2)}</span>
          </div>

          {/* Cash received */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cash Received from Customer
            </label>

            {/* Denomination buttons */}
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {DENOMINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCash(String(d))}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    cashNum === d
                      ? 'bg-orange-500 text-white border-orange-500 shadow'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-600'
                  }`}
                >
                  ₱{d}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="Enter amount..."
                autoFocus
                className="w-full pl-9 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-xl font-bold text-gray-800 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>

          {/* Change / Short feedback */}
          {cashNum > 0 && (
            <div className={`rounded-xl px-5 py-4 flex justify-between items-center ${
              hasChange ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className={`font-semibold text-sm ${hasChange ? 'text-green-700' : 'text-red-600'}`}>
                {hasChange ? 'Change' : 'Short by'}
              </span>
              <span className={`text-2xl font-bold ${hasChange ? 'text-green-600' : 'text-red-600'}`}>
                ₱{(hasChange ? diff : shortAmount).toFixed(2)}
              </span>
            </div>
          )}

          {/* Utang section — shown when customer is short */}
          {isShort && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">
                Record ₱{shortAmount.toFixed(2)} as Utang?
              </p>

              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full border border-amber-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">— Skip, don't record utang —</option>
                {utangCustomers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.customer_name} (balance: ₱{Math.max(0, c.balance).toFixed(2)})
                  </option>
                ))}
              </select>

              {/* Quick-add new customer */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewCustomer()}
                  placeholder="New customer name..."
                  className="flex-1 border border-amber-300 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddNewCustomer}
                  disabled={!newCustomerName.trim() || addingCustomer}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {addingCustomer ? '…' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-bold text-base transition-colors shadow-md shadow-orange-200"
            >
              {submitting ? 'Processing…' : 'Confirm Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── New Sale Page ────────────────────────────────────────────────────────────

export default function NewSale() {
  const [products, setProducts] = useState([])
  const [pinnedIds, setPinnedIds] = useState(() => getPinnedIds())
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [cart, setCart] = useState([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    getProducts().then(setProducts).finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(products.map((p) => p.category_name).filter(Boolean))].sort()

  const inStockProducts = products.filter((p) => p.quantity > 0)

  const pinnedProducts = inStockProducts.filter((p) => pinnedIds.has(p.id))
  const filtered = inStockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || p.category_name === filterCategory
    return matchSearch && matchCat
  })

  const handleTogglePin = useCallback((e, productId) => {
    e.stopPropagation()
    togglePin(productId)
    setPinnedIds(getPinnedIds())
  }, [])

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

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product.id !== productId))

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  const handleCheckoutConfirm = async ({ cashGiven, utangInfo }) => {
    const sale = await createSale({
      items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      note: note.trim() || undefined,
    })

    let utangName = ''
    let utangAmount = 0

    if (utangInfo) {
      await addUtangEntry(utangInfo.customerId, {
        type: 'debt',
        amount: utangInfo.amount,
        note: `Sale #${sale.id}`,
      })
      utangName = utangInfo.customerName
      utangAmount = utangInfo.amount
    }

    const saleWithExtras = {
      ...sale,
      _cashGiven: cashGiven >= sale.total ? cashGiven : 0,
      _utangAmount: utangAmount,
      _utangName: utangName,
    }

    setSuccess(saleWithExtras)
    setCart([])
    setNote('')
    setCheckoutOpen(false)

    const updated = await getProducts()
    setProducts(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading products...</p>
      </div>
    )
  }

  const ProductCard = ({ p }) => {
    const inCart = cart.find((i) => i.product.id === p.id)
    const isPinned = pinnedIds.has(p.id)
    return (
      <button
        onClick={() => addToCart(p)}
        className={`bg-white rounded-xl p-4 text-left shadow-sm border transition-all hover:shadow-md active:scale-95 relative ${
          inCart ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100 hover:border-orange-200'
        }`}
      >
        <button
          onClick={(e) => handleTogglePin(e, p.id)}
          className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${
            isPinned ? 'text-amber-400 hover:text-amber-500' : 'text-gray-200 hover:text-amber-300'
          }`}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Star className="w-3.5 h-3.5" fill={isPinned ? 'currentColor' : 'none'} />
        </button>
        <p className="text-sm font-semibold text-gray-800 leading-tight mb-1 pr-5">{p.name}</p>
        <p className="text-xs text-gray-400 mb-3">{p.category_name}</p>
        <div className="flex items-center justify-between">
          <span className="text-orange-600 font-bold">₱{p.price.toFixed(2)}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            p.quantity <= 10 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
          }`}>
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
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {pinnedProducts.length > 0 && !search && !filterCategory && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pinned</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pinnedProducts.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              <div className="border-t border-dashed border-gray-200 mt-6" />
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
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
                    <button onClick={() => removeFromCart(product.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800">{quantity}</span>
                      <button onClick={() => updateQty(product.id, 1)} disabled={quantity >= product.quantity} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-gray-800">₱{(product.price * quantity).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">₱{product.price.toFixed(2)} × {quantity}</p>
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

          <button
            onClick={() => setCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-md shadow-orange-200 disabled:shadow-none"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* ── Checkout Modal ────────────────────────────────────────────────── */}
      {checkoutOpen && (
        <CheckoutModal
          total={total}
          cart={cart}
          note={note}
          onConfirm={handleCheckoutConfirm}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* ── Success Modal ─────────────────────────────────────────────────── */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Sale Complete!</h3>
            <p className="text-gray-500 text-sm mb-2">Sale #{success.id} processed successfully</p>
            <p className="text-3xl font-bold text-orange-600 mb-4">₱{success.total.toFixed(2)}</p>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-4 text-sm divide-y divide-gray-100 max-h-40 overflow-auto">
              {success.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                  <span className="font-semibold text-gray-800">₱{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {success.note && (
              <p className="text-xs text-gray-400 mb-3 italic">"{success.note}"</p>
            )}

            {success._cashGiven > 0 && (
              <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
                <div className="text-left">
                  <p className="text-xs text-green-600 font-medium">Cash Received</p>
                  <p className="text-sm font-bold text-gray-700">₱{success._cashGiven.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600 font-medium">Change</p>
                  <p className="text-lg font-bold text-green-600">₱{(success._cashGiven - success.total).toFixed(2)}</p>
                </div>
              </div>
            )}

            {success._utangAmount > 0 && (
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                <div className="text-left">
                  <p className="text-xs text-amber-600 font-medium">Utang recorded for</p>
                  <p className="text-sm font-bold text-gray-700">{success._utangName}</p>
                </div>
                <p className="text-lg font-bold text-amber-600">₱{success._utangAmount.toFixed(2)}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => printReceipt(success)}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 py-3 rounded-xl font-semibold transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setSuccess(null)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
