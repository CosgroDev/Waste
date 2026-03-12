'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ScanLine, PlusCircle, Bell, ChefHat,
  Refrigerator, Archive, Box, AlertTriangle, LogOut, Leaf,
} from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { InventoryItem } from '@/types'

const DUE_SOON_DAYS = 3

function getAlertState(item: InventoryItem): 'expired' | 'due_soon' | 'ok' {
  if (!item.expiry_date) return 'ok'
  const days = differenceInDays(parseISO(item.expiry_date), new Date())
  if (days < 0) return 'expired'
  if (days <= DUE_SOON_DAYS) return 'due_soon'
  return 'ok'
}

export default function HomePage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ff_inventory_items')
        .select('*')
        .eq('status', 'active')
        .order('expiry_date', { ascending: true, nullsFirst: false })
      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const active   = items
  const expired  = active.filter(i => getAlertState(i) === 'expired')
  const dueSoon  = active.filter(i => getAlertState(i) === 'due_soon')
  const fridge   = active.filter(i => i.storage_location === 'fridge').length
  const freezer  = active.filter(i => i.storage_location === 'freezer').length
  const cupboard = active.filter(i => i.storage_location === 'cupboard').length
  const useFirst = [...expired, ...dueSoon].slice(0, 4)

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 pt-14 pb-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">FridgeFlow</h1>
              <p className="text-xs text-primary-foreground/70">Your kitchen at a glance</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-6 max-w-lg mx-auto">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 -mt-1">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{loading ? '—' : active.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </CardContent>
          </Card>
          <Link href="/alerts">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{loading ? '—' : dueSoon.length}</p>
                <p className="text-xs text-amber-600/80 mt-0.5">Due soon</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/alerts">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{loading ? '—' : expired.length}</p>
                <p className="text-xs text-destructive/80 mt-0.5">Expired</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick actions */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild size="lg" className="h-14 justify-start gap-3">
              <Link href="/scan">
                <ScanLine className="w-5 h-5 shrink-0" />
                <span>Scan item</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 justify-start gap-3">
              <Link href="/scan?manual=1">
                <PlusCircle className="w-5 h-5 shrink-0 text-primary" />
                <span>Add manually</span>
              </Link>
            </Button>
            <Button asChild variant="outline-warning" size="lg" className="h-14 justify-start gap-3">
              <Link href="/alerts">
                <Bell className="w-5 h-5 shrink-0" />
                <span>View alerts</span>
              </Link>
            </Button>
            <Button asChild variant="outline-primary" size="lg" className="h-14 justify-start gap-3">
              <Link href="/recipes">
                <ChefHat className="w-5 h-5 shrink-0" />
                <span>Get recipes</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Storage summary */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Storage
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Fridge', icon: Refrigerator, count: fridge, href: '/inventory?loc=fridge' },
              { label: 'Freezer', icon: Archive, count: freezer, href: '/inventory?loc=freezer' },
              { label: 'Cupboard', icon: Box, count: cupboard, href: '/inventory?loc=cupboard' },
            ].map(({ label, icon: Icon, count, href }) => (
              <Link key={label} href={href}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-3 text-center">
                    <Icon className="w-5 h-5 mx-auto text-primary mb-1.5" />
                    <p className="text-lg font-bold">{loading ? '—' : count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Use first */}
        {!loading && useFirst.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Use first</h2>
            </div>
            <div className="space-y-2">
              {useFirst.map(item => {
                const state = getAlertState(item)
                const days = item.expiry_date
                  ? differenceInDays(parseISO(item.expiry_date), new Date())
                  : null
                return (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <Card className="hover:border-primary/20 transition-colors">
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {item.storage_location}
                          </p>
                        </div>
                        <Badge variant={state === 'expired' ? 'destructive' : 'warning'}>
                          {state === 'expired'
                            ? `${Math.abs(days!)}d over`
                            : days === 0 ? 'Today' : `${days}d left`}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <Nav />
    </div>
  )
}
