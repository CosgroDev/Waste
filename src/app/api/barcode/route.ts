import { NextRequest, NextResponse } from 'next/server'

// Module-level token cache — reused across requests in the same serverless instance
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getFatSecretToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const clientId = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('FatSecret credentials not configured')

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`FatSecret auth failed: ${res.status}`)

  const data = await res.json()
  cachedToken = data.access_token as string
  tokenExpiresAt = Date.now() + (data.expires_in as number) * 1000 - 60_000 // 1 min buffer
  return cachedToken
}

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')
  if (!barcode) {
    return NextResponse.json({ error: 'barcode parameter required' }, { status: 400 })
  }

  try {
    const token = await getFatSecretToken()

    // Step 1: resolve barcode → food_id
    const barcodeRes = await fetch(
      `https://platform.fatsecret.com/rest/food/barcode.v1?barcode=${encodeURIComponent(barcode)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!barcodeRes.ok) {
      console.error(`FatSecret barcode error: ${barcodeRes.status}`)
      return NextResponse.json({ found: false, error: `Upstream error ${barcodeRes.status}` })
    }

    const barcodeData = await barcodeRes.json()
    const foodId = barcodeData?.food_id?.value ?? barcodeData?.food_id

    if (!foodId) {
      return NextResponse.json({ found: false })
    }

    // Step 2: get food details
    const foodRes = await fetch(
      `https://platform.fatsecret.com/rest/food/v4?food_id=${encodeURIComponent(foodId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!foodRes.ok) {
      console.error(`FatSecret food lookup error: ${foodRes.status}`)
      return NextResponse.json({ found: false, error: `Upstream error ${foodRes.status}` })
    }

    const foodData = await foodRes.json()
    const food = foodData?.food

    if (!food) {
      return NextResponse.json({ found: false })
    }

    const productName = (food.food_name as string | undefined) ?? null
    const brand = (food.brand_name as string | undefined) ?? null
    const category = (food.food_type as string | undefined) ?? null

    return NextResponse.json({
      found: true,
      product: {
        barcode,
        product_name: productName,
        brand,
        category,
        image_url: null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Barcode lookup failed:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
