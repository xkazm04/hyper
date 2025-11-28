'use client'

import { CharacterAsset } from '@/lib/types'
import { AssetCard } from './AssetCard'

interface AssetGridProps {
  assets: CharacterAsset[]
  onAssetClick?: (asset: CharacterAsset) => void
  emptyMessage?: string
}

export function AssetGrid({ assets, onAssetClick, emptyMessage = 'No assets found' }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-muted-foreground"
        data-testid="asset-grid-empty"
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      data-testid="asset-grid"
    >
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onAssetClick?.(asset)}
        />
      ))}
    </div>
  )
}
