import { differenceInDays, parseISO } from 'date-fns'
import type { InventoryItem } from '@/types'

export interface PrioritisedItem {
  item: InventoryItem
  score: number
  urgencyLabel: string
}

/**
 * Scores each active inventory item for recipe prioritisation.
 *
 * Priority order (highest score first):
 *   1. Expired fridge item
 *   2. Due-soon fridge item (≤ 3 days)
 *   3. Fridge item nearest expiry
 *   4. Cupboard item
 *   5. Freezer item (lowest unless includeFreeze=true)
 */
export function prioritiseItems(
  items: InventoryItem[],
  includeFreeze = false,
  dueSoonDays = 3
): PrioritisedItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const scored: PrioritisedItem[] = items
    .filter(i => i.status === 'active')
    .filter(i => includeFreeze || i.storage_location !== 'freezer')
    .map(item => {
      let score = 0
      let urgencyLabel = ''

      const daysLeft = item.expiry_date
        ? differenceInDays(parseISO(item.expiry_date), today)
        : null

      if (item.storage_location === 'fridge') {
        if (daysLeft !== null && daysLeft < 0) {
          score = 1000 + Math.abs(daysLeft) // expired – highest
          urgencyLabel = `Expired ${Math.abs(daysLeft)}d ago`
        } else if (daysLeft !== null && daysLeft <= dueSoonDays) {
          score = 800 - daysLeft            // due soon
          urgencyLabel = `Due in ${daysLeft}d`
        } else if (daysLeft !== null) {
          score = 500 - daysLeft            // fridge, further out
          urgencyLabel = `${daysLeft}d left`
        } else {
          score = 200
          urgencyLabel = 'No expiry'
        }
      } else if (item.storage_location === 'cupboard') {
        if (daysLeft !== null && daysLeft < 0) {
          score = 600 + Math.abs(daysLeft)
          urgencyLabel = `Expired ${Math.abs(daysLeft)}d ago`
        } else if (daysLeft !== null) {
          score = 300 - Math.min(daysLeft, 300)
          urgencyLabel = `${daysLeft}d left`
        } else {
          score = 100
          urgencyLabel = 'Cupboard staple'
        }
      } else {
        // freezer
        score = 50
        urgencyLabel = item.frozen_date
          ? `Frozen ${differenceInDays(today, parseISO(item.frozen_date))}d ago`
          : 'Frozen'
      }

      return { item, score, urgencyLabel }
    })

  return scored.sort((a, b) => b.score - a.score)
}

export function buildRecipePromptContext(
  prioritised: PrioritisedItem[],
  cuisinePreference?: string,
  includeFreeze?: boolean
): string {
  const urgent = prioritised.filter(p => p.score >= 600).slice(0, 6)
  const available = prioritised.slice(0, 20)

  const urgentList = urgent
    .map(p => `- ${p.item.product_name}${p.item.brand ? ` (${p.item.brand})` : ''} [${p.item.storage_location}] – ${p.urgencyLabel}`)
    .join('\n')

  const availableList = available
    .map(p => `- ${p.item.product_name} [${p.item.storage_location}]`)
    .join('\n')

  return [
    `You are a practical home-cooking assistant. Generate exactly 3 recipe suggestions.`,
    ``,
    `MOST URGENT ITEMS (use these first):`,
    urgentList || '(none)',
    ``,
    `ALL AVAILABLE INVENTORY:`,
    availableList || '(empty)',
    ``,
    cuisinePreference ? `Cuisine preference: ${cuisinePreference}` : '',
    includeFreeze ? 'Freezer items may also be used.' : 'Prefer fridge and cupboard items; avoid freezer unless essential.',
    ``,
    `Rules:`,
    `1. Each recipe MUST use at least one urgent item if possible.`,
    `2. You may list a few common pantry staples as "missing ingredients" if needed.`,
    `3. Do NOT invent ingredients not in the inventory or common staples.`,
    `4. Keep steps concise and practical.`,
    `5. Add a brief note explaining which urgent items are used and why.`,
    ``,
    `Respond ONLY with a valid JSON array of 3 recipe objects with this shape:`,
    `[`,
    `  {`,
    `    "title": "string",`,
    `    "description": "string (1–2 sentences)",`,
    `    "urgentItemsUsed": ["string"],`,
    `    "ingredients": ["string"],`,
    `    "missingIngredients": ["string"],`,
    `    "method": ["string (one step per element)"],`,
    `    "urgencyNote": "string"`,
    `  }`,
    `]`,
  ]
    .filter(Boolean)
    .join('\n')
}
