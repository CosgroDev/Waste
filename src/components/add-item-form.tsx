'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Refrigerator, Archive, Box } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { StorageLocation, ExpiryType, ProductLookupResult } from '@/types'

interface Props {
  prefill?: Partial<ProductLookupResult>
  defaultLocation?: StorageLocation
  onSaved?: () => void
}

const storageOptions: { value: StorageLocation; label: string; Icon: React.ElementType }[] = [
  { value: 'fridge', label: 'Fridge', Icon: Refrigerator },
  { value: 'freezer', label: 'Freezer', Icon: Archive },
  { value: 'cupboard', label: 'Cupboard', Icon: Box },
]

export default function AddItemForm({ prefill, defaultLocation = 'fridge', onSaved }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [productName, setProductName] = useState(prefill?.product_name ?? '')
  const [brand, setBrand] = useState(prefill?.brand ?? '')
  const [category, setCategory] = useState(prefill?.category ?? '')
  const [location, setLocation] = useState<StorageLocation>(defaultLocation)
  const [expiryType, setExpiryType] = useState<ExpiryType>('use_by')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productName.trim()) return
    if (expiryType !== 'unknown' && !expiryDate) {
      setError('Please enter an expiry date, or set the type to Unknown.')
      return
    }
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: dbError } = await supabase.from('ff_inventory_items').insert({
      user_id: user.id,
      barcode: prefill?.barcode ?? null,
      product_name: productName.trim(),
      brand: brand.trim() || null,
      category: category.trim() || null,
      image_url: prefill?.image_url ?? null,
      storage_location: location,
      expiry_type: expiryType,
      expiry_date: expiryDate || null,
      original_expiry_date: expiryDate || null,
      quantity: quantity.trim() || null,
      notes: notes.trim() || null,
      status: 'active',
      source: prefill?.barcode ? 'barcode_scan' : 'manual_entry',
    })

    if (dbError) {
      setError(dbError.message)
    } else {
      onSaved?.()
      router.push('/inventory')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={productName}
          onChange={e => setProductName(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. Whole milk"
        />
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        <input
          type="text"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Optional"
        />
      </div>

      {/* Storage location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Storage location <span className="text-red-500">*</span>
        </label>
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

      {/* Expiry type */}
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

      {/* Expiry date */}
      {expiryType !== 'unknown' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
        <input
          type="text"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. 2 packs, 500ml"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Optional notes"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving || !productName.trim()}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save item'}
      </button>
    </form>
  )
}
