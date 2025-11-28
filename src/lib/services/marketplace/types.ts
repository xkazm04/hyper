// Shared types and utilities for marketplace service modules
import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  CharacterAsset,
  CuratedCollection,
  AssetDownload,
  AssetReview,
  MarketplaceApiKey,
  AssetPurchase,
  AssetVersion,
  PayoutRequest,
  CreatorEarning,
  CreatorBalance,
} from '@/lib/types'

// Re-export types for convenience
export type {
  CharacterAsset,
  CuratedCollection,
  CollectionAsset,
  AssetDownload,
  AssetReview,
  MarketplaceApiKey,
  AssetPurchase,
  AssetVersion,
  PayoutRequest,
  CreatorEarning,
  CreatorBalance,
  CreateCharacterAssetInput,
  UpdateCharacterAssetInput,
  CreateCuratedCollectionInput,
  UpdateCuratedCollectionInput,
  CreateAssetReviewInput,
  UpdateAssetReviewInput,
  CreateApiKeyInput,
  CreatePurchaseInput,
  CreateVersionInput,
  CreatePayoutRequestInput,
  MarketplaceSearchOptions,
  MarketplaceSearchResult,
  StoryTemplateData,
  CompatibilityInfo,
} from '@/lib/types'

export {
  AssetNotFoundError,
  CollectionNotFoundError,
  ApiKeyNotFoundError,
  InvalidApiKeyError,
  RateLimitExceededError,
  InsufficientPermissionsError,
  DatabaseError,
} from '@/lib/types'

// Base class for marketplace modules
export abstract class MarketplaceModule {
  protected supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }
}

// Mapping utilities
export function mapCharacterAsset(data: any): CharacterAsset {
  return {
    id: data.id,
    creatorId: data.creator_id,
    name: data.name,
    description: data.description,
    slug: data.slug,
    assetType: data.asset_type,
    thumbnailUrl: data.thumbnail_url,
    previewImages: data.preview_images || [],
    characterData: data.character_data,
    promptTemplate: data.prompt_template,
    storyTemplateData: data.story_template_data,
    tags: data.tags || [],
    category: data.category,
    licenseType: data.license_type,
    isFree: data.is_free,
    price: parseFloat(data.price) || 0,
    royaltyPercentage: parseFloat(data.royalty_percentage) || 0,
    downloads: data.downloads,
    rating: parseFloat(data.rating) || 0,
    ratingCount: data.rating_count,
    viewCount: data.view_count,
    isPublished: data.is_published,
    isFeatured: data.is_featured,
    isCurated: data.is_curated,
    approvalStatus: data.approval_status,
    approvalNotes: data.approval_notes,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    publishedAt: data.published_at,
    // Versioning
    version: data.version || '1.0.0',
    versionNotes: data.version_notes,
    previousVersionId: data.previous_version_id,
    isLatestVersion: data.is_latest_version ?? true,
    // Additional metadata
    demoUrl: data.demo_url,
    documentation: data.documentation,
    compatibilityInfo: data.compatibility_info,
  }
}

export function mapCharacterAssets(data: any[]): CharacterAsset[] {
  return data.map(d => mapCharacterAsset(d))
}

export function mapCuratedCollection(data: any): CuratedCollection {
  return {
    id: data.id,
    curatorId: data.curator_id,
    name: data.name,
    description: data.description,
    slug: data.slug,
    thumbnailUrl: data.thumbnail_url,
    collectionType: data.collection_type,
    displayOrder: data.display_order,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function mapCuratedCollections(data: any[]): CuratedCollection[] {
  return data.map(d => mapCuratedCollection(d))
}

export function mapAssetReview(data: any): AssetReview {
  return {
    id: data.id,
    assetId: data.asset_id,
    userId: data.user_id,
    rating: data.rating,
    reviewText: data.review_text,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function mapAssetReviews(data: any[]): AssetReview[] {
  return data.map(d => mapAssetReview(d))
}

export function mapApiKey(data: any): MarketplaceApiKey {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    keyPrefix: data.key_prefix,
    scopes: data.scopes || [],
    rateLimit: data.rate_limit,
    isActive: data.is_active,
    lastUsedAt: data.last_used_at,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  }
}

export function mapApiKeys(data: any[]): MarketplaceApiKey[] {
  return data.map(d => mapApiKey(d))
}

export function mapAssetDownload(data: any): AssetDownload {
  return {
    id: data.id,
    assetId: data.asset_id,
    userId: data.user_id,
    storyStackId: data.story_stack_id,
    downloadedAt: data.downloaded_at,
  }
}

export function mapAssetDownloads(data: any[]): AssetDownload[] {
  return data.map(d => mapAssetDownload(d))
}

export function mapAssetPurchase(data: any): AssetPurchase {
  return {
    id: data.id,
    assetId: data.asset_id,
    userId: data.user_id,
    pricePaid: parseFloat(data.price_paid) || 0,
    currency: data.currency || 'USD',
    creatorAmount: parseFloat(data.creator_amount) || 0,
    platformAmount: parseFloat(data.platform_amount) || 0,
    paymentProvider: data.payment_provider || 'stripe',
    paymentIntentId: data.payment_intent_id,
    paymentStatus: data.payment_status,
    licenseType: data.license_type,
    licenseKey: data.license_key,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  }
}

export function mapAssetPurchases(data: any[]): AssetPurchase[] {
  return data.map(d => mapAssetPurchase(d))
}

export function mapAssetVersion(data: any): AssetVersion {
  return {
    id: data.id,
    assetId: data.asset_id,
    version: data.version,
    versionNotes: data.version_notes,
    assetData: data.asset_data,
    createdBy: data.created_by,
    createdAt: data.created_at,
  }
}

export function mapAssetVersions(data: any[]): AssetVersion[] {
  return data.map(d => mapAssetVersion(d))
}

export function mapPayoutRequest(data: any): PayoutRequest {
  return {
    id: data.id,
    creatorId: data.creator_id,
    amount: parseFloat(data.amount) || 0,
    currency: data.currency || 'USD',
    payoutMethod: data.payout_method,
    payoutDetails: data.payout_details,
    status: data.status,
    processedAt: data.processed_at,
    processedBy: data.processed_by,
    referenceNumber: data.reference_number,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function mapPayoutRequests(data: any[]): PayoutRequest[] {
  return data.map(d => mapPayoutRequest(d))
}

export function mapCreatorEarning(data: any): CreatorEarning {
  return {
    id: data.id,
    creatorId: data.creator_id,
    assetId: data.asset_id,
    amount: parseFloat(data.amount) || 0,
    currency: data.currency || 'USD',
    status: data.status,
    paidAt: data.paid_at,
    payoutReference: data.payout_reference,
    createdAt: data.created_at,
  }
}

export function mapCreatorEarnings(data: any[]): CreatorEarning[] {
  return data.map(d => mapCreatorEarning(d))
}
