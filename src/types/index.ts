export type StorageLocation = 'fridge' | 'freezer' | 'cupboard'
export type ExpiryType = 'use_by' | 'best_before' | 'unknown'
export type ItemStatus = 'active' | 'consumed' | 'discarded'
export type ItemSource = 'barcode_scan' | 'manual_entry'

export interface InventoryItem {
  id: string
  user_id: string
  barcode: string | null
  product_name: string
  brand: string | null
  category: string | null
  image_url: string | null
  storage_location: StorageLocation
  expiry_type: ExpiryType
  expiry_date: string | null       // ISO date string YYYY-MM-DD
  original_expiry_date: string | null
  frozen_date: string | null
  quantity: string | null
  notes: string | null
  status: ItemStatus
  source: ItemSource
  created_at: string
  updated_at: string
}

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export interface ProductLookupResult {
  product_name: string
  brand: string | null
  category: string | null
  image_url: string | null
  barcode: string
}

export interface AlertItem extends InventoryItem {
  alertType: 'expired' | 'due_soon'
  daysOverdue?: number
  daysRemaining?: number
}

export interface Recipe {
  title: string
  description: string
  urgentItemsUsed: string[]
  ingredients: string[]
  missingIngredients: string[]
  method: string[]
  urgencyNote: string
}

export interface RecipeGenerationRequest {
  cuisinePreference?: string
  includeFreeze?: boolean
}
