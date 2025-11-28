'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AssetGrid,
  SearchFilters,
  AssetDetailModal,
  CollectionCard,
} from '@/app/features/marketplace/components'
import { useMarketplace } from '@/app/features/marketplace/lib/useMarketplace'
import { CharacterAsset, CuratedCollection, MarketplaceSearchOptions } from '@/lib/types'

export default function MarketplacePage() {
  const router = useRouter()
  const { searchAssets, getCollections, loading, error } = useMarketplace()

  const [assets, setAssets] = useState<CharacterAsset[]>([])
  const [collections, setCollections] = useState<CuratedCollection[]>([])
  const [featuredAssets, setFeaturedAssets] = useState<CharacterAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<CharacterAsset | null>(null)
  const [totalAssets, setTotalAssets] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    // Load featured assets
    const featured = await searchAssets({ isFeatured: true, pageSize: 8 })
    if (featured) {
      setFeaturedAssets(featured.assets)
    }

    // Load all assets
    const all = await searchAssets({ pageSize: 20 })
    if (all) {
      setAssets(all.assets)
      setTotalAssets(all.total)
    }

    // Load collections
    const cols = await getCollections()
    setCollections(cols)
  }

  const handleSearch = async (options: MarketplaceSearchOptions) => {
    const result = await searchAssets({ ...options, page: 1 })
    if (result) {
      setAssets(result.assets)
      setTotalAssets(result.total)
      setCurrentPage(1)
    }
  }

  const handleLoadMore = async () => {
    const result = await searchAssets({ page: currentPage + 1 })
    if (result) {
      setAssets([...assets, ...result.assets])
      setCurrentPage(currentPage + 1)
    }
  }

  const handleAssetClick = (asset: CharacterAsset) => {
    setSelectedAsset(asset)
  }

  const handleCollectionClick = (collection: CuratedCollection) => {
    router.push(`/marketplace/collections/${collection.slug}`)
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="marketplace-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">
              Discover characters, prompt templates, and avatar sets
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/marketplace/my-assets')}
            data-testid="my-assets-btn"
          >
            My Assets
          </Button>
          <Button
            onClick={() => router.push('/marketplace/create')}
            data-testid="create-asset-btn"
          >
            Publish Asset
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-8">
        <SearchFilters onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-8">
          {error}
        </div>
      )}

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse" data-testid="browse-tab">
            <TrendingUp className="w-4 h-4 mr-2" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="featured" data-testid="featured-tab">
            <Sparkles className="w-4 h-4 mr-2" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="collections" data-testid="collections-tab">
            Collections
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-6">
          <AssetGrid
            assets={assets}
            onAssetClick={handleAssetClick}
            emptyMessage="No assets found. Try adjusting your filters."
          />

          {assets.length < totalAssets && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                data-testid="load-more-btn"
              >
                {loading ? 'Loading...' : `Load More (${totalAssets - assets.length} remaining)`}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Featured Tab */}
        <TabsContent value="featured" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Featured Assets
            </h2>
            <p className="text-muted-foreground">
              Hand-picked by our curation team
            </p>
          </div>

          <AssetGrid
            assets={featuredAssets}
            onAssetClick={handleAssetClick}
            emptyMessage="No featured assets yet."
          />
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          {collections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No collections available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onClick={() => handleCollectionClick(collection)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  )
}
