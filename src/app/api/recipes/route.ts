import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildRecipePromptContext } from '@/lib/recipe-priority'
import type { PrioritisedItem } from '@/lib/recipe-priority'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const {
    prioritised,
    cuisinePreference,
    includeFreeze,
  }: {
    prioritised: PrioritisedItem[]
    cuisinePreference?: string
    includeFreeze?: boolean
  } = body

  if (!prioritised || prioritised.length === 0) {
    return NextResponse.json({ error: 'No inventory items provided' }, { status: 400 })
  }

  const prompt = buildRecipePromptContext(prioritised, cuisinePreference, includeFreeze)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Unexpected response format from AI' }, { status: 500 })
    }

    const recipes = JSON.parse(jsonMatch[0])

    // Log to ff_recipe_requests
    await supabase.from('ff_recipe_requests').insert({
      user_id: user.id,
      prompt_context_json: {
        cuisinePreference,
        includeFreeze,
        urgentItemCount: prioritised.filter(p => p.score >= 600).length,
        totalItems: prioritised.length,
      },
    })

    return NextResponse.json({ recipes })
  } catch (err) {
    console.error('Recipe generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate recipes. Please try again.' },
      { status: 500 }
    )
  }
}
