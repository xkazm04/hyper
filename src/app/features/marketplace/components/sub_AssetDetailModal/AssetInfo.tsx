'use client'

import { Star, Download, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CharacterAsset } from '@/lib/types'

interface AssetInfoProps {
  asset: CharacterAsset
}

export function AssetInfo({ asset }: AssetInfoProps) {
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          {asset.rating.toFixed(1)} ({asset.ratingCount} reviews)
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          {asset.downloads} downloads
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {asset.description}
      </p>

      {/* Tags */}
      {asset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
