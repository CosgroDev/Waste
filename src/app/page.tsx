'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ScanLine, PlusCircle, Bell, ChefHat,
  Refrigerator, Archive, Box, AlertTriangle, LogOut,
} from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
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

  const active = items
  const expired = active.filter(i => getAlertState(i) === 'expired')
  const dueSoon = active.filter(i => getAlertState(i) === 'due_soon')
  const fridge  = active.filter(i => i.storage_location === 'fridge').length
  const freezer = active.filter(i => i.storage_location === 'freezer').length
  const cupboard = active.filter(i => i.storage_location === 'cupboard').length

  const useFirst = [...expired, ...dueSoon].slice(0, 4)

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-green-600 text-white px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">FridgeFlow</h1>
            <p className="text-green-200 text-xs mt-0.5">Your kitchen at a glance</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-green-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : active.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total items</p>
          </div>
          <Link href="/alerts" className="bg-amber-50 rounded-xl p-3 shadow-sm border border-amber-100 text-center">
            <p className="text-2xl font-bold text-amber-600">{loading ? '—' : dueSoon.length}</p>
            <p className="text-xs text-amber-700 mt-0.5">Due soon</p>
          </Link>
          <Link href="/alerts" className="bg-red-50 rounded-xl p-3 shadow-sm border border-red-100 text-center">
            <p className="text-2xl font-bold text-red-600">{loading ? '—' : expired.length}</p>
            <p className="text-xs text-red-700 mt-0.5">Expired</p>
          </Link>
        </div>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/scan" className="flex items-center gap-3 bg-green-600 text-white rounded-xl px-4 py-3.5 shadow-sm">
              <ScanLine className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Scan item</span>
            </Link>
            <Link href="/scan?manual=1" className="flex items-center gap-3 bg-white text-gray-800 rounded-xl px-4 py-3.5 shadow-sm border border-gray-100">
              <PlusCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
              <span className="font-medium text-sm">Add manually</span>
            </Link>
            <Link href="/alerts" className="flex items-center gap-3 bg-white text-gray-800 rounded-xl px-4 py-3.5 shadow-sm border border-gray-100">
              <Bell className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <span className="font-medium text-sm">View alerts</span>
            </Link>
            <Link href="/recipes" className="flex items-center gap-3 bg-white text-gray-800 rounded-xl px-4 py-3.5 shadow-sm border border-gray-100">
              <ChefHat className="w-5 h-5 flex-shrink-0 text-green-600" />
              <span className="font-medium text-sm">Get recipes</span>
            </Link>
          </div>
        </section>

        {/* Storage summary */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Storage</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Fridge', icon: Refrigerator, count: fridge, href: '/inventory?loc=fridge' },
              { label: 'Freezer', icon: Archive, count: freezer, href: '/inventory?loc=freezer' },
              { label: 'Cupboard', icon: Box, count: cupboard, href: '/inventory?loc=cupboard' },
            ].map(({ label, icon: Icon, count, href }) => (
              <Link key={label} href={href} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <Icon className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">{loading ? '—' : count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Use first */}
        {!loading && useFirst.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-700">Use first</h2>
            </div>
            <div className="space-y-2">
              {useFirst.map(item => {
                const state = getAlertState(item)
                const days = item.expiry_date
                  ? differenceInDays(parseISO(item.expiry_date), new Date())
                  : null
                return (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{item.storage_location}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      state === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {state === 'expired'
                        ? `${Math.abs(days!)}d over`
                        : days === 0 ? 'Today' : `${days}d left`}
                    </span>
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
