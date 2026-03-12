'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

interface Props {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)

  useEffect(() => {
    let stopped = false

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('ff-barcode-reader')

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText: string) => {
            if (!stopped) {
              stopped = true
              scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText))
            }
          },
          () => { /* suppress per-frame errors */ }
        )

        scannerRef.current = scanner
        setStarted(true)
      } catch (err) {
        setError(
          'Camera not available. Please allow camera access or use manual entry.'
        )
      }
    }

    startScanner()

    return () => {
      stopped = true
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 p-1.5 bg-black/50 rounded-full text-white"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Scanner target */}
      <div id="ff-barcode-reader" className="w-full aspect-[4/3]" />

      {!started && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm opacity-60">Starting camera…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-sm text-red-300 text-center">{error}</p>
        </div>
      )}

      {started && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="border-2 border-white/60 rounded-lg w-64 h-40" />
        </div>
      )}

      <p className="absolute bottom-3 left-0 right-0 text-center text-white/70 text-xs">
        Point at a barcode
      </p>
    </div>
  )
}
