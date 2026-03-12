'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-destructive/30">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/'}>
              Go home
            </Button>
            <Button className="flex-1" onClick={reset}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
