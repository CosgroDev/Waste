'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { differenceInDays, parseISO, format } from 'date-fns'
import { AlertTriangle, Clock, ChefHat, Refrigerator, Archive, Box } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import type { InventoryItem } from '@/types'

const DUE_SOON_DAYS = 3

const storageIcon: Record<string, React.ElementType> = {
  fridge: Refrigerator,
  freezer: Archive,
  cupboard: Box,
}

interface AlertItem extends InventoryItem {
  days: number
}

export default function AlertsPage() {
  const [expired, setExpired] = useState<AlertItem[]>([])
  const [dueSoon, setDueSoon] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadItems() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ff_inventory_items')
      .select('*')
      .eq('status', 'active')
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true })

    const items: AlertItem[] = (data ?? []).map(item => ({
      ...item,
      days: differenceInDays(parseISO(item.expiry_date!), today),
    }))

    setExpired(items.filter(i => i.days < 0))
    setDueSoon(items.filter(i => i.days >= 0 && i.days <= DUE_SOON_DAYS))
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  async function handleConsume(id: string) {
    await supabase.from('ff_inventory_items').update({ status: 'consumed' }).eq('id', id)
    setExpired(p => p.filter(i => i.id !== id))
    setDueSoon(p => p.filter(i => i.id !== id))
  }

  async function handleDiscard(id: string) {
    await supabase.from('ff_inventory_items').update({ status: 'discarded' }).eq('id', id)
    setExpired(p => p.filter(i => i.id !== id))
    setDueSoon(p => p.filter(i => i.id !== id))
  }

  async function handleMoveToFreezer(id: string) {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('ff_inventory_items')
      .update({ storage_location: 'freezer', frozen_date: today })
      .eq('id', id)
    setExpired(p => p.filter(i => i.id !== id))
    setDueSoon(p => p.filter(i => i.id !== id))
  }

  const total = expired.length + dueSoon.length

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Alerts</h1>
          {total > 0 && (
            <Link href="/recipes" className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <ChefHat className="w-4 h-4" /> Get recipes
            </Link>
          )}
        </div>
      </header>

      <main className="px-4 pt-4 space-y-6">
        {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

        {!loading && total === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-medium text-gray-700">All clear!</p>
            <p className="text-sm text-gray-400 mt-1">No expired or expiring items.</p>
          </div>
        )}

        {/* Expired */}
        {expired.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-red-700">Expired ({expired.length})</h2>
            </div>
            <div className="space-y-2">
              {expired.map(item => (
                <AlertItemCard
                  key={item.id}
                  item={item}
                  type="expired"
                  onConsume={handleConsume}
                  onDiscard={handleDiscard}
                  onMoveToFreezer={handleMoveToFreezer}
                />
              ))}
            </div>
          </section>
        )}

        {/* Due soon */}
        {dueSoon.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-amber-700">Due soon ({dueSoon.length})</h2>
            </div>
            <div className="space-y-2">
              {dueSoon.map(item => (
                <AlertItemCard
                  key={item.id}
                  item={item}
                  type="due_soon"
                  onConsume={handleConsume}
                  onDiscard={handleDiscard}
                  onMoveToFreezer={handleMoveToFreezer}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Nav />
    </div>
  )
}

function AlertItemCard({
  item,
  type,
  onConsume,
  onDiscard,
  onMoveToFreezer,
}: {
  item: AlertItem
  type: 'expired' | 'due_soon'
  onConsume: (id: string) => void
  onDiscard: (id: string) => void
  onMoveToFreezer: (id: string) => void
}) {
  const StorageIcon = storageIcon[item.storage_location] ?? Box
  const isExpired = type === 'expired'

  return (
    <div className={`rounded-xl border p-4 ${isExpired ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StorageIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 capitalize">{item.storage_location}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">
              {item.expiry_type === 'use_by' ? 'Use by' : 'Best before'}{' '}
              {item.expiry_date ? format(parseISO(item.expiry_date), 'd MMM yyyy') : ''}
            </span>
          </div>
        </div>
        <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
          isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isExpired
            ? `${Math.abs(item.days)}d over`
            : item.days === 0 ? 'Today' : `${item.days}d left`}
        </span>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onConsume(item.id)}
          className="flex-1 py-1.5 text-xs font-medium text-green-700 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
        >
          Consumed
        </button>
        <button
          onClick={() => onDiscard(item.id)}
          className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Discarded
        </button>
        {item.storage_location !== 'freezer' && (
          <button
            onClick={() => onMoveToFreezer(item.id)}
            className="flex-1 py-1.5 text-xs font-medium text-blue-700 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Freeze
          </button>
        )}
        <Link
          href={`/recipes?from=alerts`}
          className="flex-1 py-1.5 text-xs font-medium text-purple-700 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-center"
        >
          Recipe
        </Link>
      </div>
    </div>
  )
}
