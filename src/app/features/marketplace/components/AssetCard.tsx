'use client'

import { Star, Download, Tag } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CharacterAsset } from '@/lib/types'

interface AssetCardProps {
  asset: CharacterAsset
  onClick?: () => void
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const assetTypeLabels: Record<string, string> = {
    character: 'Character',
    prompt_template: 'Prompt Template',
    avatar_set: 'Avatar Set',
    character_pack: 'Character Pack',
  }

  const licenseLabels: Record<string, string> = {
    free: 'Free',
    attribution: 'Attribution',
    'non-commercial': 'Non-Commercial',
    commercial: 'Commercial',
    exclusive: 'Exclusive',
  }

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={onClick}
      data-testid={`asset-card-${asset.id}`}
    >
      {/* Thumbnail */}
      <div className="aspect-square relative bg-muted">
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {/* Asset type badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-xs"
        >
          {assetTypeLabels[asset.assetType] || asset.assetType}
        </Badge>
        {/* Featured/Curated badges */}
        {asset.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
            Featured
          </Badge>
        )}
        {asset.isCurated && !asset.isFeatured && (
          <Badge className="absolute top-2 right-2" variant="outline">
            Curated
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate" title={asset.name}>
          {asset.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {asset.description}
        </p>

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {asset.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{asset.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {asset.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {asset.downloads}
          </span>
        </div>

        {/* Price/License */}
        <div>
          {asset.isFree ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Free
            </Badge>
          ) : (
            <Badge variant="secondary">
              ${asset.price.toFixed(2)}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
