import { useEffect, useState } from 'react'
import { getSales, getSale } from '../api'
import { parseTS, peso } from '../utils'
import { Search, X, Receipt } from 'lucide-react'

// ─── Sale Detail Modal ────────────────────────────────────────────────────────

function SaleDetailModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null)

  useEffect(() => {
    getSale(saleId).then(setSale)
  }, [saleId])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Sale #{saleId}</h3>
            {sale && (
              <p className="text-xs text-gray-400 mt-0.5">
                {parseTS(sale.created_at)?.toLocaleString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!sale ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="p-6">
              <div className="divide-y divide-gray-100">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                      <p className="text-xs text-gray-400">
                        ₱{item.price.toFixed(2)} × {item.quantity} {item.quantity > 1 ? 'pcs' : 'pc'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      ₱{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {sale.note && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    <span className="font-medium">Note:</span> {sale.note}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 bg-orange-50 rounded-b-2xl border-t border-orange-100">
              <span className="font-bold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-orange-600">₱{sale.total.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sales History Page ───────────────────────────────────────────────────────

export default function SalesHistory() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    getSales()
      .then(setSales)
      .finally(() => setLoading(false))
  }, [])

  const filtered = sales.filter(
    (s) =>
      `#${s.id}`.includes(search) ||
      s.total.toFixed(2).includes(search) ||
      parseTS(s.created_at)?.toLocaleDateString('en-PH').includes(search)
  )

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const avgSale = sales.length ? totalRevenue / sales.length : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading sales...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sales History</h2>
        <p className="text-gray-500 text-sm mt-1">{sales.length} total recorded sales</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{sales.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{peso(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Average Sale</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{peso(avgSale)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale # or amount..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Sale #</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Date & Time</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Items</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-medium">Note</th>
              <th className="text-right px-6 py-3 text-xs text-gray-500 font-medium">Total</th>
              <th className="text-right px-6 py-3 text-xs text-gray-500 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {sales.length === 0
                    ? 'No sales recorded yet. Complete a sale to see it here.'
                    : 'No matching sales found.'}
                </td>
              </tr>
            ) : (
              filtered.map((sale) => (
                <tr key={sale.id} className="hover:bg-orange-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">#{sale.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parseTS(sale.created_at)?.toLocaleString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.item_count} item{sale.item_count !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs">
                    <span className="truncate block">{sale.note || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                    {peso(sale.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedId(sale.id)}
                      className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-700 font-medium px-3 py-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors ml-auto"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <SaleDetailModal saleId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
