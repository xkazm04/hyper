'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Key, Package, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AssetGrid, AssetDetailModal, ApiKeyManager, EarningsDashboard } from '@/app/features/marketplace/components'
import { useMarketplace } from '@/app/features/marketplace/lib/useMarketplace'
import { CharacterAsset, CreatorBalance, CreatorEarning, PayoutRequest } from '@/lib/types'

export default function MyAssetsPage() {
  const router = useRouter()
  const { getMyAssets, submitForReview, deleteAsset, getEarnings, getPayouts, requestPayout, cancelPayout, loading, error } = useMarketplace()

  const [assets, setAssets] = useState<CharacterAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<CharacterAsset | null>(null)
  const [balance, setBalance] = useState<CreatorBalance | null>(null)
  const [earnings, setEarnings] = useState<CreatorEarning[]>([])
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])

  useEffect(() => {
    loadAssets()
    loadEarnings()
  }, [])

  const loadAssets = async () => {
    const result = await getMyAssets()
    setAssets(result)
  }

  const loadEarnings = async () => {
    const [earningsData, payoutsData] = await Promise.all([
      getEarnings(),
      getPayouts(),
    ])
    if (earningsData) {
      setBalance(earningsData.balance)
      setEarnings(earningsData.earnings)
    }
    setPayouts(payoutsData)
  }

  const handleRequestPayout = async (amount: number, method: string, details?: Record<string, unknown>) => {
    const result = await requestPayout(amount, method, details)
    return !!result
  }

  const handleCancelPayout = async (id: string) => {
    return await cancelPayout(id)
  }

  const handleSubmitForReview = async (id: string) => {
    const result = await submitForReview(id)
    if (result) {
      setAssets(assets.map((a) => (a.id === id ? result : a)))
    }
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    const success = await deleteAsset(id)
    if (success) {
      setAssets(assets.filter((a) => a.id !== id))
    }
  }

  const getStatusBadge = (asset: CharacterAsset) => {
    if (asset.isPublished && asset.approvalStatus === 'approved') {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>
    }
    switch (asset.approvalStatus) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'needs_changes':
        return <Badge className="bg-orange-100 text-orange-800">Needs Changes</Badge>
      default:
        return null
    }
  }

  const draftAssets = assets.filter((a) => a.approvalStatus === 'draft')
  const pendingAssets = assets.filter((a) => a.approvalStatus === 'pending_review')
  const publishedAssets = assets.filter((a) => a.isPublished && a.approvalStatus === 'approved')
  const rejectedAssets = assets.filter((a) => a.approvalStatus === 'rejected' || a.approvalStatus === 'needs_changes')

  return (
    <div className="container mx-auto py-8 px-4" data-testid="my-assets-page">
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold">My Assets</h1>
          <p className="text-muted-foreground">
            Manage your marketplace assets and API keys
          </p>
        </div>
        <Button onClick={() => router.push('/marketplace/create')} data-testid="create-new-btn">
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-8">
          {error}
        </div>
      )}

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assets" data-testid="assets-tab">
            <Package className="w-4 h-4 mr-2" />
            My Assets ({assets.length})
          </TabsTrigger>
          <TabsTrigger value="api-keys" data-testid="api-keys-tab">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="earnings" data-testid="earnings-tab">
            <DollarSign className="w-4 h-4 mr-2" />
            Earnings
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-8">
          {loading && assets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : assets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No assets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start sharing your creative work with the community
                </p>
                <Button onClick={() => router.push('/marketplace/create')}>
                  Create Your First Asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Draft Assets */}
              {draftAssets.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge variant="secondary">Draft</Badge>
                    <span>({draftAssets.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftAssets.map((asset) => (
                      <Card key={asset.id} className="overflow-hidden" data-testid={`draft-asset-${asset.id}`}>
                        <div className="aspect-video bg-muted relative">
                          {asset.thumbnailUrl ? (
                            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              No thumbnail
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium truncate">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {asset.description}
                          </p>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitForReview(asset.id)}
                              disabled={!asset.thumbnailUrl}
                              data-testid={`submit-review-${asset.id}`}
                            >
                              Submit for Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/marketplace/assets/${asset.id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Review */}
              {pendingAssets.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                    <span>({pendingAssets.length})</span>
                  </h2>
                  <AssetGrid
                    assets={pendingAssets}
                    onAssetClick={setSelectedAsset}
                  />
                </div>
              )}

              {/* Published Assets */}
              {publishedAssets.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Published</Badge>
                    <span>({publishedAssets.length})</span>
                  </h2>
                  <AssetGrid
                    assets={publishedAssets}
                    onAssetClick={setSelectedAsset}
                  />
                </div>
              )}

              {/* Rejected/Needs Changes */}
              {rejectedAssets.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Badge variant="destructive">Needs Attention</Badge>
                    <span>({rejectedAssets.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rejectedAssets.map((asset) => (
                      <Card key={asset.id} className="overflow-hidden border-destructive/50" data-testid={`rejected-asset-${asset.id}`}>
                        <div className="aspect-video bg-muted relative">
                          {asset.thumbnailUrl && (
                            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(asset)}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium truncate">{asset.name}</h3>
                          {asset.approvalNotes && (
                            <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                              <strong>Feedback:</strong> {asset.approvalNotes}
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/marketplace/assets/${asset.id}/edit`)}
                            >
                              Edit & Resubmit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <ApiKeyManager />
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <EarningsDashboard
            balance={balance}
            earnings={earnings}
            payouts={payouts}
            onRequestPayout={handleRequestPayout}
            onCancelPayout={handleCancelPayout}
            onRefresh={loadEarnings}
            loading={loading}
          />
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
