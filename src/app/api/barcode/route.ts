import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ error: 'barcode parameter required' }, { status: 400 })
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,brands,categories_tags,categories_hierarchy,image_front_small_url,nutriments`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WasteNot/1.0 (food waste reduction app)' },
      next: { revalidate: 86400 }, // cache for 24h
    })

    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false })
    }

    const p = data.product

    // Clean up category – use the first readable category
    let category: string | null = null
    if (Array.isArray(p.categories_hierarchy) && p.categories_hierarchy.length > 0) {
      // categories_hierarchy entries look like "en:dairy"
      const raw = p.categories_hierarchy[p.categories_hierarchy.length - 1] as string
      category = raw.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')
    }

    return NextResponse.json({
      found: true,
      product: {
        barcode,
        product_name: p.product_name ?? null,
        brand: p.brands ?? null,
        category,
        image_url: p.image_front_small_url ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
