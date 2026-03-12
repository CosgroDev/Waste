'use client'

import { useEffect, useState } from 'react'
import { ChefHat, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/nav'
import { prioritiseItems } from '@/lib/recipe-priority'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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
          prioritised: prioritised.map(p => ({ item: p.item, urgencyLabel: p.urgencyLabel, score: p.score })),
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
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 pt-12 pb-4">
        <h1 className="text-lg font-bold tracking-tight max-w-lg mx-auto">Recipe ideas</h1>
      </header>

      <main className="px-4 pt-5 space-y-5 max-w-lg mx-auto">
        <Card>
          <CardContent className="pt-5 space-y-5">
            {/* Cuisine */}
            <div>
              <Label className="mb-2 block">Cuisine</Label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {CUISINES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCuisine(c)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      cuisine === c
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Include freezer */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="freeze-toggle" className="cursor-pointer">Include freezer items</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Treat frozen stock as available</p>
              </div>
              <Switch
                id="freeze-toggle"
                checked={includeFreeze}
                onCheckedChange={setIncludeFreeze}
              />
            </div>

            {urgentCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">
                  {urgentCount} urgent item{urgentCount !== 1 ? 's' : ''} will be prioritised
                </p>
              </div>
            )}

            <Button
              onClick={generateRecipes}
              disabled={generating || items.length === 0}
              size="lg"
              className="w-full gap-2"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><ChefHat className="w-4 h-4" /> {generated ? 'Regenerate ideas' : 'Generate recipe ideas'}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {items.length === 0 && !generating && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Add some items to your inventory first.
          </p>
        )}

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

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
    <Card>
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{recipe.title}</CardTitle>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
          </div>
          <p className="text-sm text-muted-foreground">{recipe.description}</p>
          {recipe.urgentItemsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recipe.urgentItemsUsed.map(item => (
                <Badge key={item} variant="warning">{item}</Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="border-t border-border pt-4 space-y-4">
          {recipe.urgencyNote && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {recipe.urgencyNote}
            </p>
          )}

          <div>
            <p className="text-sm font-semibold mb-2">Ingredients</p>
            <ul className="space-y-1">
              {recipe.ingredients.map(ing => (
                <li key={ing} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span> {ing}
                </li>
              ))}
            </ul>
            {recipe.missingIngredients.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">You might also need:</p>
                <ul className="space-y-1">
                  {recipe.missingIngredients.map(ing => (
                    <li key={ing} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-0.5">•</span> {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Method</p>
            <ol className="space-y-2.5">
              {recipe.method.map((step, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
