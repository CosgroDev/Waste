import type { StorageLocation } from '@/types'

// ── Category-based rules ──────────────────────────────────────
const FRIDGE_CATEGORIES = [
  'dairy', 'meat', 'poultry', 'fish', 'seafood', 'deli', 'produce',
  'eggs', 'beverages', 'juice', 'fresh', 'refrigerated',
]
const FREEZER_CATEGORIES = ['frozen', 'ice cream', 'gelato']
const CUPBOARD_CATEGORIES = [
  'canned', 'tinned', 'pasta', 'rice', 'cereal', 'bread', 'biscuit',
  'snack', 'bakery', 'condiment', 'sauce', 'oil', 'spice', 'dried',
  'ambient', 'confectionery', 'chocolate', 'coffee', 'tea', 'sugar',
]

// ── Keyword rules ─────────────────────────────────────────────
const FRIDGE_KEYWORDS = [
  'milk', 'yoghurt', 'yogurt', 'cheese', 'butter', 'cream', 'creme',
  'fresh', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon',
  'tuna steak', 'egg', 'deli', 'salad', 'hummus', 'tofu', 'tempeh',
  'juice', 'smoothie', 'probiotic',
]
const FREEZER_KEYWORDS = [
  'frozen', 'ice cream', 'gelato', 'sorbet', 'fish finger', 'pizza',
  'edamame', 'peas', 'corn', 'chips', 'fries', 'waffles', 'pastry',
]
const CUPBOARD_KEYWORDS = [
  'pasta', 'spaghetti', 'rice', 'flour', 'sugar', 'oat', 'cereal',
  'tin', 'tins', 'canned', 'can ', 'lentil', 'bean', 'chickpea',
  'coffee', 'tea', 'oil', 'vinegar', 'sauce', 'ketchup', 'mustard',
  'mayonnaise', 'pickle', 'jam', 'honey', 'syrup', 'chocolate',
  'biscuit', 'cookie', 'cracker', 'crisp', 'nut', 'seed', 'dried',
  'spice', 'herb', 'salt', 'pepper',
]

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function matchesCategory(category: string, categories: string[]): boolean {
  const lower = category.toLowerCase()
  return categories.some(c => lower.includes(c))
}

/**
 * Returns a suggested storage location based on product name and category.
 * Returns null if no confident match is found (caller should prompt user).
 */
export function suggestStorageLocation(
  productName: string,
  category?: string | null
): StorageLocation {
  const nameAndCategory = [productName, category ?? ''].join(' ')

  // Freezer first – most specific
  if (
    matchesKeywords(nameAndCategory, FREEZER_KEYWORDS) ||
    (category && matchesCategory(category, FREEZER_CATEGORIES))
  ) {
    return 'freezer'
  }

  // Fridge
  if (
    matchesKeywords(nameAndCategory, FRIDGE_KEYWORDS) ||
    (category && matchesCategory(category, FRIDGE_CATEGORIES))
  ) {
    return 'fridge'
  }

  // Cupboard
  if (
    matchesKeywords(nameAndCategory, CUPBOARD_KEYWORDS) ||
    (category && matchesCategory(category, CUPBOARD_CATEGORIES))
  ) {
    return 'cupboard'
  }

  // Default – fridge is the safer assumption for unknown fresh food
  return 'fridge'
}
