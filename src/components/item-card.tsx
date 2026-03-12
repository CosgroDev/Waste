'use client'

import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import { Refrigerator, Archive, Box, MoreVertical } from 'lucide-react'
import clsx from 'clsx'
import type { InventoryItem } from '@/types'

interface Props {
  item: InventoryItem
  onConsume: (id: string) => void
  onDiscard: (id: string) => void
  onMoveToFreezer: (id: string) => void
}

const storageIcon: Record<string, React.ElementType> = {
  fridge: Refrigerator,
  freezer: Archive,
  cupboard: Box,
}

function expiryBadge(item: InventoryItem) {
  if (!item.expiry_date) return null
  const days = differenceInDays(parseISO(item.expiry_date), new Date())
  if (days < 0) {
    return { label: `${Math.abs(days)}d over`, classes: 'bg-red-100 text-red-700' }
  }
  if (days === 0) {
    return { label: 'Today', classes: 'bg-amber-100 text-amber-700' }
  }
  if (days <= 3) {
    return { label: `${days}d left`, classes: 'bg-amber-100 text-amber-700' }
  }
  return { label: `${days}d left`, classes: 'bg-green-100 text-green-700' }
}

export default function ItemCard({ item, onConsume, onDiscard, onMoveToFreezer }: Props) {
  const StorageIcon = storageIcon[item.storage_location] ?? Box
  const badge = expiryBadge(item)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
          {item.brand && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{item.brand}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <StorageIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 capitalize">{item.storage_location}</span>
            {badge && (
              <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badge.classes)}>
                {badge.label}
              </span>
            )}
            {item.expiry_type !== 'unknown' && (
              <span className="text-xs text-gray-400">
                {item.expiry_type === 'use_by' ? 'Use by' : 'Best before'}
              </span>
            )}
          </div>
        </div>
        <Link href={`/items/${item.id}`} className="p-1 -mr-1 text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onConsume(item.id)}
          className="flex-1 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          Consumed
        </button>
        <button
          onClick={() => onDiscard(item.id)}
          className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Discarded
        </button>
        {item.storage_location !== 'freezer' && (
          <button
            onClick={() => onMoveToFreezer(item.id)}
            className="flex-1 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Freeze
          </button>
        )}
      </div>
    </div>
  )
}
