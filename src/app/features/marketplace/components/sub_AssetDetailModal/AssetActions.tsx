'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CharacterAsset } from '@/lib/types'

interface AssetActionsProps {
  asset: CharacterAsset
  loading: boolean
  onDownload: () => void
}

export function AssetActions({ asset, loading, onDownload }: AssetActionsProps) {
  return (
    <div className="flex items-center gap-4 pt-4 border-t">
      <div className="text-2xl font-bold">
        {asset.isFree ? 'Free' : `${asset.price.toFixed(2)}`}
      </div>
      <Button
        onClick={onDownload}
        disabled={loading}
        className="flex-1"
        data-testid="download-asset-btn"
      >
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Downloading...' : 'Download Asset'}
      </Button>
    </div>
  )
}
