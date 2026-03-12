'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Refrigerator, Archive, Box } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Item not found.</p>
        <Button asChild variant="link"><Link href="/inventory">← Inventory</Link></Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="-ml-2" asChild>
              <Link href="/inventory"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-lg font-bold tracking-tight truncate">{item.product_name}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5 max-w-lg mx-auto">
        {/* Status actions */}
        {item.status === 'active' && (
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline-primary" onClick={() => handleStatusChange('consumed')}>
              Consumed
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange('discarded')}>
              Discarded
            </Button>
            {item.storage_location !== 'freezer' && (
              <Button variant="outline-blue" onClick={handleMoveToFreezer}>
                Freeze
              </Button>
            )}
          </div>
        )}

        {/* Metadata */}
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Added</span>
              <span>{format(parseISO(item.created_at), 'd MMM yyyy')}</span>
            </div>
            {item.barcode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barcode</span>
                <span className="font-mono text-xs">{item.barcode}</span>
              </div>
            )}
            {item.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{item.category}</span>
              </div>
            )}
            {item.frozen_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frozen on</span>
                <span>{format(parseISO(item.frozen_date), 'd MMM yyyy')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit details</p>

          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" required value={productName} onChange={e => setProductName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Storage location</Label>
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
              {([
                { value: 'use_by', label: 'Use by' },
                { value: 'best_before', label: 'Best before' },
                { value: 'unknown', label: 'Unknown' },
              ] as { value: ExpiryType; label: string }[]).map(opt => (
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
              <Label htmlFor="expiry">Expiry date</Label>
              <Input id="expiry" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
          )}

          {location === 'freezer' && (
            <div className="space-y-1.5">
              <Label htmlFor="frozen">Frozen date</Label>
              <Input id="frozen" type="date" value={frozenDate} onChange={e => setFrozenDate(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 2 packs" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </main>
    </div>
  )
}
