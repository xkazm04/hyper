'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApprovalQueue } from '@/app/features/marketplace/components'
import { CharacterAsset } from '@/lib/types'

export default function AdminPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const loadPendingAssets = useCallback(async (): Promise<CharacterAsset[]> => {
    try {
      const response = await fetch('/api/marketplace/admin/review')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return data.assets
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
      return []
    }
  }, [])

  const handleReview = useCallback(async (
    assetId: string,
    status: 'approved' | 'rejected' | 'needs_changes',
    notes?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/marketplace/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, status, notes }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review asset')
      return false
    }
  }, [])

  return (
    <div className="container mx-auto py-8 px-4" data-testid="admin-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/marketplace')}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold">Marketplace Admin</h1>
            <p className="text-muted-foreground">
              Review and approve submitted assets
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-8">
          {error}
          <Button
            variant="link"
            className="ml-2 p-0 h-auto"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <ApprovalQueue
        onLoadAssets={loadPendingAssets}
        onReview={handleReview}
      />
    </div>
  )
}
