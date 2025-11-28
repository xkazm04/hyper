'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CharacterAsset } from '@/lib/types'
import { useMarketplace } from '../lib/useMarketplace'
import { AssetInfo } from './sub_AssetDetailModal/AssetInfo'
import { AssetReviews } from './sub_AssetDetailModal/AssetReviews'
import { AssetActions } from './sub_AssetDetailModal/AssetActions'

interface AssetDetailModalProps {
  asset: CharacterAsset | null
  open: boolean
  onClose: () => void
  onDownload?: (asset: CharacterAsset) => void
}

const assetTypeLabels: Record<string, string> = {
  character: 'Character',
  prompt_template: 'Prompt Template',
  avatar_set: 'Avatar Set',
  character_pack: 'Character Pack',
}

const licenseLabels: Record<string, string> = {
  free: 'Free to use',
  attribution: 'Attribution required',
  'non-commercial': 'Non-commercial use only',
  commercial: 'Commercial license',
  exclusive: 'Exclusive license',
}

export function AssetDetailModal({ asset, open, onClose, onDownload }: AssetDetailModalProps) {
  const { downloadAsset, loading } = useMarketplace()
  const [selectedImage, setSelectedImage] = useState(0)

  if (!asset) return null

  const handleDownload = async () => {
    const result = await downloadAsset(asset.id)
    if (result && onDownload) {
      onDownload(result)
    }
  }

  const allImages = [
    asset.thumbnailUrl,
    ...asset.previewImages,
    ...(asset.characterData?.imageUrls || []),
  ].filter(Boolean) as string[]

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto halloween-ghost-float" 
        data-testid="asset-detail-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {asset.name}
            {asset.isFeatured && (
              <Badge className="bg-yellow-500 text-black">Featured</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="mr-2">
              {assetTypeLabels[asset.assetType]}
            </Badge>
            <Badge variant="outline" className="mr-2">
              {asset.category}
            </Badge>
            <Badge variant="secondary">
              {licenseLabels[asset.licenseType]}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Image gallery */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <AssetInfo asset={asset} />
            <AssetActions 
              asset={asset} 
              loading={loading} 
              onDownload={handleDownload} 
            />
            <AssetReviews asset={asset} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
