'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { differenceInDays, parseISO, format } from 'date-fns'
import { AlertTriangle, Clock, ChefHat, Refrigerator, Archive, Box, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { InventoryItem } from '@/types'

const DUE_SOON_DAYS = 3

const storageIcon: Record<string, React.ElementType> = {
  fridge: Refrigerator,
  freezer: Archive,
  cupboard: Box,
}

interface AlertItem extends InventoryItem { days: number }

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

  function removeItem(id: string) {
    setExpired(p => p.filter(i => i.id !== id))
    setDueSoon(p => p.filter(i => i.id !== id))
  }

  async function handleConsume(id: string) {
    await supabase.from('ff_inventory_items').update({ status: 'consumed' }).eq('id', id)
    removeItem(id)
  }

  async function handleDiscard(id: string) {
    await supabase.from('ff_inventory_items').update({ status: 'discarded' }).eq('id', id)
    removeItem(id)
  }

  async function handleMoveToFreezer(id: string) {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('ff_inventory_items')
      .update({ storage_location: 'freezer', frozen_date: today })
      .eq('id', id)
    removeItem(id)
  }

  const total = expired.length + dueSoon.length

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold tracking-tight">Alerts</h1>
          {total > 0 && (
            <Button asChild variant="outline-primary" size="sm" className="gap-1.5">
              <Link href="/recipes">
                <ChefHat className="w-4 h-4" /> Get recipes
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 pt-4 space-y-6 max-w-lg mx-auto">
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}

        {!loading && total === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No expired or expiring items.</p>
          </div>
        )}

        {expired.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="font-semibold text-destructive">
                Expired <span className="text-destructive/70 font-normal">({expired.length})</span>
              </h2>
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

        {dueSoon.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-amber-700">
                Due soon <span className="text-amber-600/70 font-normal">({dueSoon.length})</span>
              </h2>
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
  item, type, onConsume, onDiscard, onMoveToFreezer,
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
    <Card className={isExpired ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{item.product_name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <StorageIcon className="w-3.5 h-3.5" />
                <span className="capitalize">{item.storage_location}</span>
              </span>
              {item.expiry_date && (
                <span className="text-xs text-muted-foreground">
                  {item.expiry_type === 'use_by' ? 'Use by' : 'Best before'}{' '}
                  {format(parseISO(item.expiry_date), 'd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
          <Badge variant={isExpired ? 'destructive' : 'warning'}>
            {isExpired
              ? `${Math.abs(item.days)}d over`
              : item.days === 0 ? 'Today' : `${item.days}d left`}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline-primary" size="xs" className="flex-1" onClick={() => onConsume(item.id)}>
            Consumed
          </Button>
          <Button variant="outline" size="xs" className="flex-1" onClick={() => onDiscard(item.id)}>
            Discarded
          </Button>
          {item.storage_location !== 'freezer' && (
            <Button variant="outline-blue" size="xs" className="flex-1" onClick={() => onMoveToFreezer(item.id)}>
              Freeze
            </Button>
          )}
          <Button variant="ghost" size="xs" className="flex-1 text-primary" asChild>
            <Link href="/recipes">Recipe</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
