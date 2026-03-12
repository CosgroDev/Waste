'use client'

import { useEffect, useState } from 'react'
import { ChefHat, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import { prioritiseItems } from '@/lib/recipe-priority'
import type { InventoryItem, Recipe } from '@/types'

const CUISINES = ['Any', 'British', 'Italian', 'Asian', 'Mexican', 'Mediterranean', 'French']

export default function RecipesPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cuisine, setCuisine] = useState('Any')
  const [includeFreeze, setIncludeFreeze] = useState(false)
  const [generated, setGenerated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ff_inventory_items')
        .select('*')
        .eq('status', 'active')
      setItems(data ?? [])
    }
    load()
  }, [])

  async function generateRecipes() {
    setGenerating(true)
    setError(null)
    setRecipes([])

    const prioritised = prioritiseItems(items, includeFreeze)

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prioritised: prioritised.map(p => ({
            item: p.item,
            urgencyLabel: p.urgencyLabel,
            score: p.score,
          })),
          cuisinePreference: cuisine === 'Any' ? undefined : cuisine,
          includeFreeze,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate recipes')
      setRecipes(data.recipes)
      setGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setGenerating(false)
  }

  const urgentCount = prioritiseItems(items, includeFreeze).filter(p => p.score >= 600).length

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-gray-900">Recipe ideas</h1>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {CUISINES.map(c => (
                <button
                  key={c}
                  onClick={() => setCuisine(c)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    cuisine === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Include freezer items</p>
              <p className="text-xs text-gray-400 mt-0.5">Treat frozen stock as available</p>
            </div>
            <button
              onClick={() => setIncludeFreeze(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                includeFreeze ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  includeFreeze ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {urgentCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                {urgentCount} urgent item{urgentCount !== 1 ? 's' : ''} will be prioritised
              </p>
            </div>
          )}

          <button
            onClick={generateRecipes}
            disabled={generating || items.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4" />
                {generated ? 'Regenerate' : 'Generate recipe ideas'}
              </>
            )}
          </button>
        </div>

        {items.length === 0 && !generating && (
          <p className="text-center text-sm text-gray-400 py-4">
            Add some items to your inventory first.
          </p>
        )}

        {error && (
          <div className="bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Recipe cards */}
        {recipes.map((recipe, i) => (
          <RecipeCard key={i} recipe={recipe} />
        ))}
      </main>

      <Nav />
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
          </div>
          <RefreshCw className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>

        {/* Urgent items used */}
        {recipe.urgentItemsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.urgentItemsUsed.map(item => (
              <span key={item} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {item}
              </span>
            ))}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          {/* Urgency note */}
          {recipe.urgencyNote && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              {recipe.urgencyNote}
            </p>
          )}

          {/* Ingredients */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map(ing => (
                <li key={ing} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span> {ing}
                </li>
              ))}
            </ul>
            {recipe.missingIngredients.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 font-medium mb-1">You might also need:</p>
                <ul className="space-y-1">
                  {recipe.missingIngredients.map(ing => (
                    <li key={ing} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="mt-0.5">•</span> {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Method */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Method</h4>
            <ol className="space-y-2">
              {recipe.method.map((step, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
