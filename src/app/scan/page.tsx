'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ScanLine, PenLine, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AddItemForm from '@/components/add-item-form'
import Nav from '@/components/nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { suggestStorageLocation } from '@/lib/storage-suggestion'
import type { ProductLookupResult, StorageLocation } from '@/types'

const BarcodeScanner = dynamic(() => import('@/components/barcode-scanner'), { ssr: false })

type Step = 'choose' | 'scanning' | 'form'

function ScanPageContent() {
  const searchParams = useSearchParams()
  const startManual = searchParams.get('manual') === '1'

  const [step, setStep] = useState<Step>(startManual ? 'form' : 'choose')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [product, setProduct] = useState<Partial<ProductLookupResult> | undefined>()
  const [suggestedLocation, setSuggestedLocation] = useState<StorageLocation>('fridge')

  async function handleBarcodeScan(barcode: string) {
    setLookingUp(true)
    setLookupError(null)
    setStep('form')

    try {
      const res = await fetch(`/api/barcode?barcode=${encodeURIComponent(barcode)}`)
      const data = await res.json()
      if (data.found) {
        setProduct(data.product)
        setSuggestedLocation(suggestStorageLocation(data.product.product_name, data.product.category))
      } else {
        // Not found is fine — let user fill in manually
        setProduct({ barcode })
        setLookupError('Product not found in database — fill in the details below.')
      }
    } catch (err) {
      setProduct({ barcode })
      setLookupError(
        `Couldn't reach the product database (${err instanceof Error ? err.message : 'network error'}) — please fill in the details manually.`
      )
    }
    setLookingUp(false)
  }

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" className="-ml-2" asChild>
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold tracking-tight">
            {step === 'form' ? 'Add item' : 'Scan barcode'}
          </h1>
        </div>
      </header>

      <main className="px-4 pt-5 max-w-lg mx-auto">
        {step === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-5">
              How do you want to add this item?
            </p>
            <Card
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setStep('scanning')}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <ScanLine className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Scan barcode</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Use your camera to scan a product barcode
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => { setStep('form'); setProduct(undefined) }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <PenLine className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Add manually</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Type in the product details yourself
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'scanning' && (
          <div className="space-y-4">
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setStep('choose')}
            />
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => { setStep('form'); setProduct(undefined) }}
            >
              Enter manually instead
            </Button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            {lookingUp && (
              <Card className="border-primary/20 bg-accent">
                <CardContent className="py-3 px-4 text-sm text-accent-foreground text-center">
                  Looking up product…
                </CardContent>
              </Card>
            )}
            {lookupError && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-3 px-4 text-sm text-amber-700">{lookupError}</CardContent>
              </Card>
            )}
            {product?.product_name && !lookingUp && (
              <Card className="border-primary/20 bg-accent">
                <CardContent className="py-3 px-4 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-primary font-medium">Product found</p>
                    <p className="text-sm font-semibold mt-0.5">{product.product_name}</p>
                    {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            <AddItemForm prefill={product} defaultLocation={suggestedLocation} />

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setStep('scanning')}
            >
              ← Scan a different barcode
            </Button>
          </div>
        )}
      </main>

      <Nav />
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanPageContent />
    </Suspense>
  )
}
