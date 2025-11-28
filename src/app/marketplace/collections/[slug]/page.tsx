'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssetGrid, AssetDetailModal } from '@/app/features/marketplace/components'
import { useMarketplace } from '@/app/features/marketplace/lib/useMarketplace'
import { CharacterAsset, CuratedCollection } from '@/lib/types'

interface CollectionPageProps {
  params: Promise<{ slug: string }>
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const { getCollection, loading, error } = useMarketplace()

  const [collection, setCollection] = useState<CuratedCollection | null>(null)
  const [assets, setAssets] = useState<CharacterAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<CharacterAsset | null>(null)

  useEffect(() => {
    loadCollection()
  }, [slug])

  const loadCollection = async () => {
    const result = await getCollection(slug)
    if (result) {
      setCollection(result.collection)
      setAssets(result.assets)
    }
  }

  const collectionTypeLabels: Record<string, string> = {
    featured: 'Featured',
    staff_picks: 'Staff Picks',
    themed: 'Themed Collection',
    seasonal: 'Seasonal',
    new_creators: 'New Creators',
  }

  if (loading && !collection) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/marketplace')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Collection Not Found</h1>
            <p className="text-muted-foreground">
              {error || 'This collection does not exist or has been removed.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="collection-page">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/marketplace')}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            <Badge variant="secondary">
              {collectionTypeLabels[collection.collectionType] || collection.collectionType}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {collection.description}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
          </p>
        </div>
      </div>

      {/* Collection thumbnail banner */}
      {collection.thumbnailUrl && (
        <div className="aspect-[3/1] mb-8 rounded-xl overflow-hidden bg-muted">
          <img
            src={collection.thumbnailUrl}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Assets */}
      <AssetGrid
        assets={assets}
        onAssetClick={setSelectedAsset}
        emptyMessage="This collection is empty."
      />

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  )
}
