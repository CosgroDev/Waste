'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Refrigerator, Archive, Box } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, StorageLocation, ExpiryType } from '@/types'

const storageOptions: { value: StorageLocation; label: string; Icon: React.ElementType }[] = [
  { value: 'fridge', label: 'Fridge', Icon: Refrigerator },
  { value: 'freezer', label: 'Freezer', Icon: Archive },
  { value: 'cupboard', label: 'Cupboard', Icon: Box },
]

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [productName, setProductName] = useState('')
  const [brand, setBrand] = useState('')
  const [location, setLocation] = useState<StorageLocation>('fridge')
  const [expiryType, setExpiryType] = useState<ExpiryType>('use_by')
  const [expiryDate, setExpiryDate] = useState('')
  const [frozenDate, setFrozenDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ff_inventory_items')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setItem(data)
        setProductName(data.product_name)
        setBrand(data.brand ?? '')
        setLocation(data.storage_location)
        setExpiryType(data.expiry_type)
        setExpiryDate(data.expiry_date ?? '')
        setFrozenDate(data.frozen_date ?? '')
        setQuantity(data.quantity ?? '')
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!productName.trim()) return
    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('ff_inventory_items')
      .update({
        product_name: productName.trim(),
        brand: brand.trim() || null,
        storage_location: location,
        expiry_type: expiryType,
        expiry_date: expiryDate || null,
        frozen_date: frozenDate || null,
        quantity: quantity.trim() || null,
        notes: notes.trim() || null,
      })
      .eq('id', id)

    if (dbError) {
      setError(dbError.message)
    } else {
      router.push('/inventory')
    }
    setSaving(false)
  }

  async function handleStatusChange(status: 'consumed' | 'discarded') {
    await supabase.from('ff_inventory_items').update({ status }).eq('id', id)
    router.push('/inventory')
  }

  async function handleMoveToFreezer() {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('ff_inventory_items')
      .update({ storage_location: 'freezer', frozen_date: today })
      .eq('id', id)
    setLocation('freezer')
    setFrozenDate(today)
    setItem(prev => prev ? { ...prev, storage_location: 'freezer', frozen_date: today } : prev)
  }

  async function handleDelete() {
    if (!confirm('Delete this item? This cannot be undone.')) return
    await supabase.from('ff_inventory_items').delete().eq('id', id)
    router.push('/inventory')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Item not found.</p>
        <Link href="/inventory" className="text-green-600 text-sm font-medium">← Back to inventory</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inventory" className="p-2 -ml-2 text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{item.product_name}</h1>
          </div>
          <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Status actions */}
        {item.status === 'active' && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleStatusChange('consumed')}
              className="py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-xl border border-green-200"
            >
              Consumed
            </button>
            <button
              onClick={() => handleStatusChange('discarded')}
              className="py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl border border-gray-200"
            >
              Discarded
            </button>
            {item.storage_location !== 'freezer' && (
              <button
                onClick={handleMoveToFreezer}
                className="py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl border border-blue-200"
              >
                Freeze
              </button>
            )}
          </div>
        )}

        {/* Item metadata */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Added</span>
            <span className="text-gray-700">{format(parseISO(item.created_at), 'd MMM yyyy')}</span>
          </div>
          {item.barcode && (
            <div className="flex justify-between">
              <span className="text-gray-400">Barcode</span>
              <span className="text-gray-700 font-mono text-xs">{item.barcode}</span>
            </div>
          )}
          {item.category && (
            <div className="flex justify-between">
              <span className="text-gray-400">Category</span>
              <span className="text-gray-700 capitalize">{item.category}</span>
            </div>
          )}
          {item.frozen_date && (
            <div className="flex justify-between">
              <span className="text-gray-400">Frozen</span>
              <span className="text-gray-700">{format(parseISO(item.frozen_date), 'd MMM yyyy')}</span>
            </div>
          )}
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Edit details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
            <input
              type="text"
              required
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Storage location</label>
            <div className="grid grid-cols-3 gap-2">
              {storageOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocation(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors ${
                    location === value
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry type</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'use_by', label: 'Use by' },
                { value: 'best_before', label: 'Best before' },
                { value: 'unknown', label: 'Unknown' },
              ] as { value: ExpiryType; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiryType(opt.value)}
                  className={`py-2 text-xs font-medium rounded-lg border-2 transition-colors ${
                    expiryType === opt.value
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {expiryType !== 'unknown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {location === 'freezer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frozen date</label>
              <input
                type="date"
                value={frozenDate}
                onChange={e => setFrozenDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="text"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 2 packs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </main>
    </div>
  )
}
