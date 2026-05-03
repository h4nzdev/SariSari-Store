import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../api'
import { Store, User, Save, CheckCircle } from 'lucide-react'

export default function Settings() {
  const [form, setForm] = useState({ store_name: '', owner_name: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSettings().then((s) => {
      setForm({ store_name: s.store_name, owner_name: s.owner_name })
      setLoading(false)
    })
  }, [])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateSettings(form)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your store information.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Store className="w-4 h-4 text-orange-500" />
              Store Name
            </div>
          </label>
          <input
            name="store_name"
            value={form.store_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="e.g. Tindahan ni Aling Nena"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <User className="w-4 h-4 text-orange-500" />
              Store Owner Name
            </div>
          </label>
          <input
            name="owner_name"
            value={form.owner_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="e.g. Aling Nena"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Changes appear in the sidebar after navigating away and back.
        </p>
      </form>
    </div>
  )
}
