import { useEffect, useState } from 'react'
import { getUtang, createUtangCustomer, addUtangEntry, deleteUtangCustomer } from '../api'
import { peso } from '../utils'
import {
  Plus, ChevronDown, ChevronUp, Trash2, X,
  AlertTriangle, UserPlus, TrendingDown, Banknote, Search,
} from 'lucide-react'

// ─── Entry Modal ──────────────────────────────────────────────────────────────

function EntryModal({ customer, defaultType = 'debt', onClose, onSave }) {
  const [type, setType] = useState(defaultType)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(customer.id, { type, amount: parseFloat(amount), note })
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-800">
            {type === 'debt' ? 'Add Utang' : 'Record Bayad'}
            <span className="text-orange-500 ml-1">· {customer.customer_name}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setType('debt')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'debt' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Utang (Debt)
            </button>
            <button
              type="button"
              onClick={() => setType('payment')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'payment' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bayad (Payment)
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'debt' ? 'e.g. Coke, sardines, rice...' : 'e.g. Partial payment'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors ${
                type === 'debt'
                  ? 'bg-red-500 hover:bg-red-600 disabled:opacity-60'
                  : 'bg-green-500 hover:bg-green-600 disabled:opacity-60'
              }`}
            >
              {saving ? 'Saving...' : type === 'debt' ? 'Add Utang' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Customer Modal ───────────────────────────────────────────────────────

function AddCustomerModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(name)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-800">Add Customer</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aling Rosa"
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">{error}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Customer Card ────────────────────────────────────────────────────────────

function CustomerCard({ customer, onAddEntry, onDelete, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isPaid = customer.balance <= 0
  const isOverpaid = customer.balance < 0

  const handleDelete = async () => {
    if (!confirm(`Delete all utang records for ${customer.customer_name}?`)) return
    setDeleting(true)
    try {
      await onDelete(customer.id)
      onRefresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isPaid ? 'border-gray-100' : customer.balance > 100 ? 'border-red-200' : 'border-amber-200'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{customer.customer_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{customer.entries.length} entries</p>
        </div>

        <div className="text-right mr-2">
          <p className={`text-lg font-bold ${isPaid ? 'text-green-600' : isOverpaid ? 'text-blue-600' : 'text-red-600'}`}>
            {isOverpaid ? `+${peso(Math.abs(customer.balance))}` : peso(Math.max(0, customer.balance))}
          </p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPaid ? 'bg-green-100 text-green-700' :
            customer.balance > 100 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {isPaid ? 'Bayad na' : 'May utang'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onAddEntry(customer, 'debt')}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            title="Add debt"
          >
            +Utang
          </button>
          <button
            onClick={() => onAddEntry(customer, 'payment')}
            className="text-xs bg-green-50 hover:bg-green-100 text-green-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            title="Record payment"
          >
            Bayad
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entries */}
      {expanded && (
        <div className="border-t border-gray-50">
          {customer.entries.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No entries yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...customer.entries].reverse().map((entry) => (
                <div key={entry.id} className={`flex items-center gap-3 px-5 py-3 ${
                  entry.type === 'debt' ? 'bg-red-50/40' : 'bg-green-50/40'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    entry.type === 'debt' ? 'bg-red-400' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${entry.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.type === 'debt' ? 'Utang' : 'Bayad'}
                    </p>
                    {entry.note && <p className="text-xs text-gray-500 truncate">{entry.note}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${entry.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.type === 'debt' ? '+' : '-'}{peso(entry.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.created_at.replace(' ', 'T')).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Running balance footer */}
          <div className={`flex justify-between items-center px-5 py-3 border-t ${
            isPaid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
          }`}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</span>
            <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
              {peso(Math.max(0, customer.balance))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Utang Page ───────────────────────────────────────────────────────────────

export default function Utang() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [entryModal, setEntryModal] = useState(null) // { customer, defaultType }

  const load = async () => {
    const data = await getUtang()
    // Sort: customers with balance first, then alphabetically
    data.sort((a, b) => b.balance - a.balance || a.customer_name.localeCompare(b.customer_name))
    setCustomers(data)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0)
  const withUtang = customers.filter((c) => c.balance > 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Utang Tracker</h2>
          <p className="text-gray-500 text-sm mt-1">Track customer credit and payments</p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-orange-200 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-500">Total Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{peso(totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-amber-500" />
            <p className="text-sm text-gray-500">Customers w/ Utang</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{withUtang}</p>
        </div>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      )}

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">{customers.length === 0 ? 'No customers yet. Add one to start tracking.' : 'No customers match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onAddEntry={(c, type) => setEntryModal({ customer: c, defaultType: type })}
              onDelete={deleteUtangCustomer}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSave={async (name) => {
            await createUtangCustomer(name)
            await load()
          }}
        />
      )}

      {entryModal && (
        <EntryModal
          customer={entryModal.customer}
          defaultType={entryModal.defaultType}
          onClose={() => setEntryModal(null)}
          onSave={async (customerId, data) => {
            await addUtangEntry(customerId, data)
            await load()
          }}
        />
      )}
    </div>
  )
}
