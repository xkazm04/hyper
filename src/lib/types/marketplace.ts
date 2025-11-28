// Marketplace types - Character Asset Marketplace

// Asset types
export type AssetType = 'character' | 'prompt_template' | 'avatar_set' | 'character_pack' | 'story_template'
export type AssetCategory = 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'anime' | 'realistic' | 'cartoon' | 'other'
export type LicenseType = 'free' | 'attribution' | 'non-commercial' | 'commercial' | 'exclusive'
export type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_changes'
export type CollectionType = 'featured' | 'staff_picks' | 'themed' | 'seasonal' | 'new_creators'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'stripe_connect'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

// Character data stored in assets
export interface CharacterAssetData {
  name: string
  appearance: string
  imageUrls: string[]
  imagePrompts: string[]
  avatarUrl: string | null
  avatarPrompt: string | null
}

// Prompt template data
export interface PromptTemplateData {
  template: string
  variables: string[]
  category: string
  style: string
}

// Story template data - contains full story graph structure
export interface StoryTemplateData {
  storyStack: {
    title: string
    description: string
    theme: string
    firstCardId: string | null
  }
  storyCards: Array<{
    id: string
    title: string
    content: string
    imageUrl: string | null
    imagePrompt: string | null
    orderIndex: number
  }>
  choices: Array<{
    id: string
    storyCardId: string
    label: string
    targetCardId: string | null
    orderIndex: number
  }>
  metadata: {
    cardCount: number
    choiceCount: number
    estimatedPlayTime: number // in minutes
    complexity: 'simple' | 'moderate' | 'complex'
  }
}

// Compatibility info for templates
export interface CompatibilityInfo {
  minVersion?: string
  features?: string[]
  dependencies?: string[]
}

// Main Character Asset interface
export interface CharacterAsset {
  id: string
  creatorId: string
  name: string
  description: string
  slug: string
  assetType: AssetType
  thumbnailUrl: string | null
  previewImages: string[]
  characterData: CharacterAssetData | null
  promptTemplate: PromptTemplateData | null
  storyTemplateData: StoryTemplateData | null
  tags: string[]
  category: AssetCategory
  licenseType: LicenseType
  isFree: boolean
  price: number
  royaltyPercentage: number
  downloads: number
  rating: number
  ratingCount: number
  viewCount: number
  isPublished: boolean
  isFeatured: boolean
  isCurated: boolean
  approvalStatus: ApprovalStatus
  approvalNotes: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  // Versioning
  version: string
  versionNotes: string | null
  previousVersionId: string | null
  isLatestVersion: boolean
  // Additional metadata
  demoUrl: string | null
  documentation: string | null
  compatibilityInfo: CompatibilityInfo | null
}

// Curated Collection
export interface CuratedCollection {
  id: string
  curatorId: string | null
  name: string
  description: string
  slug: string
  thumbnailUrl: string | null
  collectionType: CollectionType
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Collection Asset (join table)
export interface CollectionAsset {
  id: string
  collectionId: string
  assetId: string
  displayOrder: number
  addedAt: string
}

// Asset Download
export interface AssetDownload {
  id: string
  assetId: string
  userId: string
  storyStackId: string | null
  downloadedAt: string
}

// Asset Review
export interface AssetReview {
  id: string
  assetId: string
  userId: string
  rating: number
  reviewText: string | null
  createdAt: string
  updatedAt: string
}

// Marketplace API Key
export interface MarketplaceApiKey {
  id: string
  userId: string
  name: string
  keyPrefix: string
  scopes: string[]
  rateLimit: number
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
  expiresAt: string | null
}

// API Usage Log
export interface ApiUsageLog {
  id: string
  apiKeyId: string | null
  userId: string | null
  endpoint: string
  method: string
  assetId: string | null
  responseStatus: number | null
  responseTimeMs: number | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

// Creator Earnings
export interface CreatorEarning {
  id: string
  creatorId: string
  assetId: string | null
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'paid' | 'failed'
  paidAt: string | null
  payoutReference: string | null
  createdAt: string
}

// Asset Purchase
export interface AssetPurchase {
  id: string
  assetId: string | null
  userId: string
  pricePaid: number
  currency: string
  creatorAmount: number
  platformAmount: number
  paymentProvider: string
  paymentIntentId: string | null
  paymentStatus: PaymentStatus
  licenseType: LicenseType
  licenseKey: string
  createdAt: string
  completedAt: string | null
}

// Asset Version
export interface AssetVersion {
  id: string
  assetId: string
  version: string
  versionNotes: string | null
  assetData: Record<string, unknown>
  createdBy: string | null
  createdAt: string
}

// Payout Request
export interface PayoutRequest {
  id: string
  creatorId: string
  amount: number
  currency: string
  payoutMethod: PayoutMethod
  payoutDetails: Record<string, unknown> | null
  status: PayoutStatus
  processedAt: string | null
  processedBy: string | null
  referenceNumber: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Creator balance summary
export interface CreatorBalance {
  availableBalance: number
  pendingEarnings: number
  totalEarned: number
  totalPaidOut: number
  currency: string
}

// Input types for creating/updating marketplace entities
export interface CreateCharacterAssetInput {
  name: string
  description: string
  assetType: AssetType
  thumbnailUrl?: string
  previewImages?: string[]
  characterData?: CharacterAssetData
  promptTemplate?: PromptTemplateData
  storyTemplateData?: StoryTemplateData
  tags?: string[]
  category: AssetCategory
  licenseType?: LicenseType
  isFree?: boolean
  price?: number
  royaltyPercentage?: number
  demoUrl?: string
  documentation?: string
  compatibilityInfo?: CompatibilityInfo
}

export interface UpdateCharacterAssetInput {
  name?: string
  description?: string
  assetType?: AssetType
  thumbnailUrl?: string | null
  previewImages?: string[]
  characterData?: CharacterAssetData | null
  promptTemplate?: PromptTemplateData | null
  storyTemplateData?: StoryTemplateData | null
  tags?: string[]
  category?: AssetCategory
  licenseType?: LicenseType
  isFree?: boolean
  price?: number
  royaltyPercentage?: number
  isPublished?: boolean
  version?: string
  versionNotes?: string
  demoUrl?: string | null
  documentation?: string | null
  compatibilityInfo?: CompatibilityInfo | null
}

// Purchase input
export interface CreatePurchaseInput {
  assetId: string
  paymentIntentId: string
}

// Version input
export interface CreateVersionInput {
  assetId: string
  version: string
  versionNotes?: string
}

// Payout request input
export interface CreatePayoutRequestInput {
  amount: number
  payoutMethod: PayoutMethod
  payoutDetails?: Record<string, unknown>
}

export interface SubmitAssetForReviewInput {
  assetId: string
}

export interface ReviewAssetInput {
  assetId: string
  status: 'approved' | 'rejected' | 'needs_changes'
  notes?: string
}

export interface CreateCuratedCollectionInput {
  name: string
  description: string
  thumbnailUrl?: string
  collectionType: CollectionType
  displayOrder?: number
}

export interface UpdateCuratedCollectionInput {
  name?: string
  description?: string
  thumbnailUrl?: string | null
  collectionType?: CollectionType
  displayOrder?: number
  isActive?: boolean
}

export interface CreateAssetReviewInput {
  assetId: string
  rating: number
  reviewText?: string
}

export interface UpdateAssetReviewInput {
  rating?: number
  reviewText?: string
}

export interface CreateApiKeyInput {
  name: string
  scopes?: string[]
  rateLimit?: number
  expiresAt?: string
}

// Search/filter options for marketplace
export interface MarketplaceSearchOptions {
  query?: string
  assetType?: AssetType
  category?: AssetCategory
  tags?: string[]
  licenseType?: LicenseType
  isFree?: boolean
  isFeatured?: boolean
  isCurated?: boolean
  sortBy?: 'downloads' | 'rating' | 'newest' | 'price'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface MarketplaceSearchResult {
  assets: CharacterAsset[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Error types for marketplace
export class AssetNotFoundError extends Error {
  constructor(id: string) {
    super(`Character asset not found: ${id}`)
    this.name = 'AssetNotFoundError'
  }
}

export class CollectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Curated collection not found: ${id}`)
    this.name = 'CollectionNotFoundError'
  }
}

export class ApiKeyNotFoundError extends Error {
  constructor(id: string) {
    super(`API key not found: ${id}`)
    this.name = 'ApiKeyNotFoundError'
  }
}

export class InvalidApiKeyError extends Error {
  constructor(message = 'Invalid or expired API key') {
    super(message)
    this.name = 'InvalidApiKeyError'
  }
}

export class RateLimitExceededError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitExceededError'
  }
}

export class InsufficientPermissionsError extends Error {
  constructor(message = 'Insufficient permissions for this action') {
    super(message)
    this.name = 'InsufficientPermissionsError'
  }
}
