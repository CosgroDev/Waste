import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ error: 'barcode parameter required' }, { status: 400 })
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,categories_hierarchy,image_front_small_url`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WasteNot/1.0 (food waste reduction app)' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.error(`OFF API error: ${res.status} ${res.statusText}`)
      return NextResponse.json({ found: false, error: `Upstream error ${res.status}` })
    }

    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false })
    }

    const p = data.product

    // Derive a readable category from the hierarchy (last entry, e.g. "en:dairy" → "dairy")
    let category: string | null = null
    if (Array.isArray(p.categories_hierarchy) && p.categories_hierarchy.length > 0) {
      const raw = p.categories_hierarchy[p.categories_hierarchy.length - 1] as string
      category = raw.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')
    }

    return NextResponse.json({
      found: true,
      product: {
        barcode,
        product_name: (p.product_name as string | undefined) ?? null,
        brand: (p.brands as string | undefined) ?? null,
        category,
        image_url: (p.image_front_small_url as string | undefined) ?? null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Barcode lookup failed:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
