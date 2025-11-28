'use client'

import { CharacterAsset } from '@/lib/types'
import { QueueItem } from './QueueItem'

interface QueueListProps {
  assets: CharacterAsset[]
  loading: boolean
  onPreview: (asset: CharacterAsset) => void
  onReview: (asset: CharacterAsset, status: 'approved' | 'rejected' | 'needs_changes') => void
}

export function QueueList({ assets, loading, onPreview, onReview }: QueueListProps) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {loading ? 'Loading...' : 'No assets pending review'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assets.map((asset) => (
        <QueueItem
          key={asset.id}
          asset={asset}
          onPreview={onPreview}
          onReview={onReview}
        />
      ))}
    </div>
  )
}
