'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Refrigerator, Archive, Box } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
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

const expiryOptions: { value: ExpiryType; label: string }[] = [
  { value: 'use_by', label: 'Use by' },
  { value: 'best_before', label: 'Best before' },
  { value: 'unknown', label: 'Unknown' },
]

export default function AddItemForm({ prefill, defaultLocation = 'fridge', onSaved }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [productName, setProductName] = useState(prefill?.product_name ?? '')
  const [brand, setBrand] = useState(prefill?.brand ?? '')
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
      category: (prefill as { category?: string })?.category ?? null,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="product_name">
          Product name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="product_name"
          required
          value={productName}
          onChange={e => setProductName(e.target.value)}
          placeholder="e.g. Whole milk"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand">
          Brand <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="brand"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          placeholder="e.g. Arla"
        />
      </div>

      <div className="space-y-2">
        <Label>Storage location <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-3 gap-2">
          {storageOptions.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocation(value)}
              className={cn(
                'flex flex-col items-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                location === value
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Expiry type</Label>
        <div className="grid grid-cols-3 gap-2">
          {expiryOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExpiryType(opt.value)}
              className={cn(
                'py-2 text-xs font-medium rounded-lg border-2 transition-all',
                expiryType === opt.value
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {expiryType !== 'unknown' && (
        <div className="space-y-1.5">
          <Label htmlFor="expiry_date">
            Expiry date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="expiry_date"
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="quantity">
          Quantity <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="quantity"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="e.g. 2 packs, 500ml"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes about this item"
          rows={2}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" size="lg" disabled={saving || !productName.trim()} className="w-full">
        {saving ? 'Saving…' : 'Save item'}
      </Button>
    </form>
  )
}
