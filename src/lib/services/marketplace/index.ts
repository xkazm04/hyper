// Barrel file for marketplace service modules
// Preserves backward compatibility with original marketplace.ts exports

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { AssetsService } from './assets'
import { CollectionsService } from './collections'
import { ReviewsService } from './reviews'
import { ApiService } from './api'
import { PurchasesService } from './purchases'
import {
  CharacterAsset,
  AssetDownload,
  AssetPurchase,
  AssetVersion,
  CuratedCollection,
  AssetReview,
  MarketplaceApiKey,
  PayoutRequest,
  CreatorEarning,
  CreatorBalance,
  CreateCharacterAssetInput,
  UpdateCharacterAssetInput,
  CreateCuratedCollectionInput,
  CreateAssetReviewInput,
  UpdateAssetReviewInput,
  CreateApiKeyInput,
  CreatePayoutRequestInput,
  MarketplaceSearchOptions,
  MarketplaceSearchResult,
} from './types'

// Re-export sub-services for direct access
export { AssetsService } from './assets'
export { CollectionsService } from './collections'
export { ReviewsService } from './reviews'
export { ApiService } from './api'
export { PurchasesService } from './purchases'

// Re-export types
export * from './types'

/**
 * MarketplaceService - Unified facade for all marketplace operations
 * Maintains backward compatibility with original marketplace.ts API
 */
export class MarketplaceService {
  private assetsService: AssetsService
  private collectionsService: CollectionsService
  private reviewsService: ReviewsService
  private apiService: ApiService
  private purchasesService: PurchasesService

  constructor(supabaseClient?: SupabaseClient) {
    const client = supabaseClient || createClient()
    this.assetsService = new AssetsService(client)
    this.collectionsService = new CollectionsService(client)
    this.reviewsService = new ReviewsService(client)
    this.apiService = new ApiService(client)
    this.purchasesService = new PurchasesService(client)
  }

  // ============================================================================
  // Character Asset Operations
  // ============================================================================

  async searchAssets(options?: MarketplaceSearchOptions): Promise<MarketplaceSearchResult> {
    return this.assetsService.searchAssets(options)
  }

  async getAsset(id: string): Promise<CharacterAsset | null> {
    return this.assetsService.getAsset(id)
  }

  async getAssetBySlug(slug: string): Promise<CharacterAsset | null> {
    return this.assetsService.getAssetBySlug(slug)
  }

  async getCreatorAssets(creatorId: string): Promise<CharacterAsset[]> {
    return this.assetsService.getCreatorAssets(creatorId)
  }

  async createAsset(input: CreateCharacterAssetInput): Promise<CharacterAsset> {
    return this.assetsService.createAsset(input)
  }

  async updateAsset(id: string, input: UpdateCharacterAssetInput): Promise<CharacterAsset> {
    return this.assetsService.updateAsset(id, input)
  }

  async deleteAsset(id: string): Promise<void> {
    return this.assetsService.deleteAsset(id)
  }

  async submitForReview(id: string): Promise<CharacterAsset> {
    return this.assetsService.submitForReview(id)
  }

  async reviewAsset(
    id: string,
    status: 'approved' | 'rejected' | 'needs_changes',
    notes?: string
  ): Promise<CharacterAsset> {
    return this.assetsService.reviewAsset(id, status, notes)
  }

  async getPendingReviewAssets(): Promise<CharacterAsset[]> {
    return this.assetsService.getPendingReviewAssets()
  }

  async downloadAsset(assetId: string, storyStackId?: string): Promise<CharacterAsset> {
    return this.assetsService.downloadAsset(assetId, storyStackId)
  }

  async getUserDownloads(): Promise<AssetDownload[]> {
    return this.assetsService.getUserDownloads()
  }

  // ============================================================================
  // Curated Collection Operations
  // ============================================================================

  async getCollections(): Promise<CuratedCollection[]> {
    return this.collectionsService.getCollections()
  }

  async getCollectionBySlug(slug: string): Promise<CuratedCollection | null> {
    return this.collectionsService.getCollectionBySlug(slug)
  }

  async getCollectionAssets(collectionId: string): Promise<CharacterAsset[]> {
    return this.collectionsService.getCollectionAssets(collectionId)
  }

  async createCollection(input: CreateCuratedCollectionInput): Promise<CuratedCollection> {
    return this.collectionsService.createCollection(input)
  }

  async addAssetToCollection(collectionId: string, assetId: string, displayOrder?: number): Promise<void> {
    return this.collectionsService.addAssetToCollection(collectionId, assetId, displayOrder)
  }

  async removeAssetFromCollection(collectionId: string, assetId: string): Promise<void> {
    return this.collectionsService.removeAssetFromCollection(collectionId, assetId)
  }

  // ============================================================================
  // Review Operations
  // ============================================================================

  async getAssetReviews(assetId: string): Promise<AssetReview[]> {
    return this.reviewsService.getAssetReviews(assetId)
  }

  async createReview(input: CreateAssetReviewInput): Promise<AssetReview> {
    return this.reviewsService.createReview(input)
  }

  async updateReview(id: string, input: UpdateAssetReviewInput): Promise<AssetReview> {
    return this.reviewsService.updateReview(id, input)
  }

  async deleteReview(id: string): Promise<void> {
    return this.reviewsService.deleteReview(id)
  }

  // ============================================================================
  // API Key Operations
  // ============================================================================

  async createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: MarketplaceApiKey; rawKey: string }> {
    return this.apiService.createApiKey(input)
  }

  async getApiKeys(): Promise<MarketplaceApiKey[]> {
    return this.apiService.getApiKeys()
  }

  async revokeApiKey(id: string): Promise<void> {
    return this.apiService.revokeApiKey(id)
  }

  async validateApiKey(rawKey: string): Promise<MarketplaceApiKey> {
    return this.apiService.validateApiKey(rawKey)
  }

  hasScope(apiKey: MarketplaceApiKey, requiredScope: string): boolean {
    return this.apiService.hasScope(apiKey, requiredScope)
  }

  async logApiUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    assetId?: string,
    responseStatus?: number,
    responseTimeMs?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    return this.apiService.logApiUsage(
      apiKeyId, endpoint, method, assetId, responseStatus, responseTimeMs, ipAddress, userAgent
    )
  }

  // ============================================================================
  // Purchase Operations
  // ============================================================================

  async recordPurchase(assetId: string, paymentIntentId: string): Promise<AssetPurchase> {
    return this.purchasesService.recordPurchase(assetId, paymentIntentId)
  }

  async getPurchase(id: string): Promise<AssetPurchase | null> {
    return this.purchasesService.getPurchase(id)
  }

  async getUserPurchases(): Promise<AssetPurchase[]> {
    return this.purchasesService.getUserPurchases()
  }

  async getAssetPurchases(assetId: string): Promise<AssetPurchase[]> {
    return this.purchasesService.getAssetPurchases(assetId)
  }

  async hasUserPurchased(assetId: string): Promise<boolean> {
    return this.purchasesService.hasUserPurchased(assetId)
  }

  // ============================================================================
  // Version Operations
  // ============================================================================

  async createVersion(assetId: string, version: string, versionNotes?: string): Promise<AssetVersion> {
    return this.purchasesService.createVersion(assetId, version, versionNotes)
  }

  async getVersion(id: string): Promise<AssetVersion | null> {
    return this.purchasesService.getVersion(id)
  }

  async getAssetVersions(assetId: string): Promise<AssetVersion[]> {
    return this.purchasesService.getAssetVersions(assetId)
  }

  // ============================================================================
  // Earnings Operations
  // ============================================================================

  async getCreatorEarnings(): Promise<CreatorEarning[]> {
    return this.purchasesService.getCreatorEarnings()
  }

  async getCreatorBalance(): Promise<CreatorBalance> {
    return this.purchasesService.getCreatorBalance()
  }

  // ============================================================================
  // Payout Operations
  // ============================================================================

  async getPayoutRequests(): Promise<PayoutRequest[]> {
    return this.purchasesService.getPayoutRequests()
  }

  async createPayoutRequest(input: CreatePayoutRequestInput): Promise<PayoutRequest> {
    return this.purchasesService.createPayoutRequest(input)
  }

  async cancelPayoutRequest(id: string): Promise<void> {
    return this.purchasesService.cancelPayoutRequest(id)
  }
}
