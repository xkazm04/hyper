'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CharacterAsset } from '@/lib/types'
import { AssetDetailModal } from './AssetDetailModal'
import { QueueList } from './sub_ApprovalQueue/QueueList'
import { ApprovalActions } from './sub_ApprovalQueue/ApprovalActions'

interface ApprovalQueueProps {
  assets?: CharacterAsset[]
  onLoadAssets?: () => Promise<CharacterAsset[]>
  onReview?: (assetId: string, status: 'approved' | 'rejected' | 'needs_changes', notes?: string) => Promise<boolean>
}

export function ApprovalQueue({ assets: propAssets, onLoadAssets, onReview }: ApprovalQueueProps) {
  const [assets, setAssets] = useState<CharacterAsset[]>(propAssets || [])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<CharacterAsset | null>(null)
  const [reviewAsset, setReviewAsset] = useState<CharacterAsset | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'needs_changes'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!propAssets && onLoadAssets) {
      loadAssets()
    }
  }, [propAssets, onLoadAssets])

  useEffect(() => {
    if (propAssets) {
      setAssets(propAssets)
    }
  }, [propAssets])

  const loadAssets = async () => {
    if (!onLoadAssets) return
    setLoading(true)
    try {
      const result = await onLoadAssets()
      setAssets(result)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!reviewAsset || !onReview) return
    setSubmitting(true)
    try {
      const success = await onReview(reviewAsset.id, reviewStatus, reviewNotes || undefined)
      if (success) {
        setAssets(assets.filter((a) => a.id !== reviewAsset.id))
        setReviewAsset(null)
        setReviewNotes('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const openReviewDialog = (asset: CharacterAsset, status: 'approved' | 'rejected' | 'needs_changes') => {
    setReviewAsset(asset)
    setReviewStatus(status)
    setReviewNotes('')
  }

  return (
    <Card data-testid="approval-queue">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Approval Queue
            </CardTitle>
            <CardDescription>
              Review and approve submitted assets for the marketplace
            </CardDescription>
          </div>
          {onLoadAssets && (
            <Button variant="outline" onClick={loadAssets} disabled={loading} data-testid="refresh-queue-btn">
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <QueueList
          assets={assets}
          loading={loading}
          onPreview={setSelectedAsset}
          onReview={openReviewDialog}
        />
      </CardContent>

      {/* Preview Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Review Dialog */}
      <ApprovalActions
        reviewAsset={reviewAsset}
        reviewStatus={reviewStatus}
        reviewNotes={reviewNotes}
        setReviewNotes={setReviewNotes}
        submitting={submitting}
        onClose={() => setReviewAsset(null)}
        onConfirm={handleReview}
      />
    </Card>
  )
}
