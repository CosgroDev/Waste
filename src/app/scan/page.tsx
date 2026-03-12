'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ScanLine, PenLine } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AddItemForm from '@/components/add-item-form'
import Nav from '@/components/nav'
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
        setSuggestedLocation(
          suggestStorageLocation(data.product.product_name, data.product.category)
        )
      } else {
        setProduct({ barcode })
        setLookupError('Product not found in database. Please fill in the details.')
      }
    } catch {
      setProduct({ barcode })
      setLookupError('Lookup failed. Please fill in the details manually.')
    }
    setLookingUp(false)
  }

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">
            {step === 'form' ? 'Add item' : 'Scan barcode'}
          </h1>
        </div>
      </header>

      <main className="px-4 pt-5">
        {step === 'choose' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">How do you want to add this item?</p>
            <div className="space-y-3">
              <button
                onClick={() => setStep('scanning')}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <ScanLine className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Scan barcode</p>
                  <p className="text-sm text-gray-500 mt-0.5">Use your camera to scan a product barcode</p>
                </div>
              </button>

              <button
                onClick={() => { setStep('form'); setProduct(undefined) }}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Add manually</p>
                  <p className="text-sm text-gray-500 mt-0.5">Type in the product details yourself</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="space-y-4">
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setStep('choose')}
            />
            <button
              onClick={() => { setStep('form'); setProduct(undefined) }}
              className="w-full text-center text-sm text-green-600 font-medium py-2"
            >
              Skip – enter manually instead
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            {lookingUp && (
              <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
                Looking up product…
              </div>
            )}
            {lookupError && (
              <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700">
                {lookupError}
              </div>
            )}
            {product?.product_name && (
              <div className="bg-green-50 rounded-xl px-4 py-3">
                <p className="text-xs text-green-600 font-medium">Product found</p>
                <p className="text-sm font-semibold text-green-900 mt-0.5">{product.product_name}</p>
                {product.brand && <p className="text-xs text-green-700">{product.brand}</p>}
              </div>
            )}
            <AddItemForm
              prefill={product}
              defaultLocation={suggestedLocation}
            />
            <button
              onClick={() => setStep('scanning')}
              className="w-full text-center text-sm text-gray-500 py-2"
            >
              ← Scan a different barcode
            </button>
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
