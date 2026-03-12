'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ScanLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import ItemCard from '@/components/item-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InventoryItem, StorageLocation } from '@/types'

const tabs: { value: 'all' | StorageLocation; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fridge', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'cupboard', label: 'Cupboard' },
]

type SortKey = 'expiry' | 'newest' | 'alpha'

function InventoryContent() {
  const searchParams = useSearchParams()
  const initLoc = (searchParams.get('loc') ?? 'all') as 'all' | StorageLocation
  const [activeTab, setActiveTab] = useState<'all' | StorageLocation>(initLoc)
  const [sort, setSort] = useState<SortKey>('expiry')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ff_inventory_items').select('*').eq('status', 'active')
      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleConsume(id: string) {
    await supabase.from('ff_inventory_items').update({ status: 'consumed' }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleDiscard(id: string) {
    await supabase.from('ff_inventory_items').update({ status: 'discarded' }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleMoveToFreezer(id: string) {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('ff_inventory_items')
      .update({ storage_location: 'freezer', frozen_date: today })
      .eq('id', id)
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, storage_location: 'freezer', frozen_date: today } : i)
    )
  }

  const filtered = items.filter(i => activeTab === 'all' || i.storage_location === activeTab)

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'expiry') {
      if (!a.expiry_date && !b.expiry_date) return 0
      if (!a.expiry_date) return 1
      if (!b.expiry_date) return -1
      return a.expiry_date.localeCompare(b.expiry_date)
    }
    if (sort === 'newest') return b.created_at.localeCompare(a.created_at)
    return a.product_name.localeCompare(b.product_name)
  })

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3 max-w-lg mx-auto">
          <h1 className="text-lg font-bold tracking-tight">Inventory</h1>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary">
            <Link href="/scan">
              <ScanLine className="w-4 h-4" /> Add
            </Link>
          </Button>
        </div>

        {/* Location tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-lg mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Sort bar */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar max-w-lg mx-auto">
        {([
          { key: 'expiry', label: 'Expiry soon' },
          { key: 'newest', label: 'Newest' },
          { key: 'alpha', label: 'A–Z' },
        ] as { key: SortKey; label: string }[]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
              sort === opt.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <main className="px-4 space-y-2 pb-4 max-w-lg mx-auto">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        )}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Nothing here yet.</p>
            <Button asChild variant="link" className="mt-2 gap-1.5">
              <Link href="/scan">
                <ScanLine className="w-4 h-4" /> Add your first item
              </Link>
            </Button>
          </div>
        )}
        {sorted.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onConsume={handleConsume}
            onDiscard={handleDiscard}
            onMoveToFreezer={handleMoveToFreezer}
          />
        ))}
      </main>

      <Nav />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense>
      <InventoryContent />
    </Suspense>
  )
}
