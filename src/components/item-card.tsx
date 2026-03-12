'use client'

import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import { Refrigerator, Archive, Box, MoreVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  if (days < 0)   return { label: `${Math.abs(days)}d over`, variant: 'destructive' as const }
  if (days === 0) return { label: 'Today', variant: 'warning' as const }
  if (days <= 3)  return { label: `${days}d left`, variant: 'warning' as const }
  return { label: `${days}d left`, variant: 'success' as const }
}

export default function ItemCard({ item, onConsume, onDiscard, onMoveToFreezer }: Props) {
  const StorageIcon = storageIcon[item.storage_location] ?? Box
  const badge = expiryBadge(item)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{item.product_name}</p>
            {item.brand && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.brand}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <StorageIcon className="w-3.5 h-3.5" />
                <span className="capitalize">{item.storage_location}</span>
              </span>
              {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              {item.expiry_type !== 'unknown' && (
                <span className="text-xs text-muted-foreground">
                  {item.expiry_type === 'use_by' ? 'Use by' : 'Best before'}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 shrink-0" asChild>
            <Link href={`/items/${item.id}`}>
              <MoreVertical className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
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
        </div>
      </CardContent>
    </Card>
  )
}
