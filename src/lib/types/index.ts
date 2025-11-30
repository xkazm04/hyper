// Re-export all types from domain-specific files for backward compatibility
// This barrel file preserves all existing import paths

// Common types - User, Session, Errors, and shared utilities
export {
  type User,
  type Session,
  type PreviewTheme,
  // Error classes
  StoryNotFoundError,
  CardNotFoundError,
  ChoiceNotFoundError,
  CharacterNotFoundError,
  CharacterCardNotFoundError,
  UnauthorizedError,
  ImageGenerationError,
  ImageUploadError,
  StoryValidationError,
  DatabaseError,
  // Deprecated types
  type PaginatedResponse,
  type PaginationStrategy,
  type Package,
  type Deployment,
  type StackReference,
  type Asset,
  type PackageCategory,
} from './common'

// Story types - StoryStack, StoryCard, CharacterCard, validation, and related input types
export {
  type StoryStack,
  type StoryCard,
  type CharacterCard,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type CreateStoryStackInput,
  type UpdateStoryStackInput,
  type CreateStoryCardInput,
  type UpdateStoryCardInput,
  type CreateCharacterCardInput,
  type UpdateCharacterCardInput,
  // Deprecated types
  type Stack,
  type CreateStackInput,
  type UpdateStackInput,
  type StackVersion,
  type CreateStackVersionInput,
  type FlattenedStack,
} from './story'

// Card types - Choice, deprecated Card/Element types
export {
  type Choice,
  type CreateChoiceInput,
  type UpdateChoiceInput,
  // Deprecated types
  type Card,
  type Element,
  type ElementType,
  type NestedStackProperties,
} from './card'

// Character types - Character, archetypes, poses
export {
  type Character,
  type CharacterArchetype,
  type CharacterPose,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from './character'

// Marketplace types - Character Asset Marketplace
export {
  type AssetType,
  type AssetCategory,
  type LicenseType,
  type ApprovalStatus,
  type CollectionType,
  type CharacterAssetData,
  type PromptTemplateData,
  type StoryTemplateData,
  type CompatibilityInfo,
  type AssetVersion,
  type AssetPurchase,
  type PayoutRequest,
  type CreatorBalance,
  type CharacterAsset,
  type CuratedCollection,
  type CollectionAsset,
  type AssetDownload,
  type AssetReview,
  type MarketplaceApiKey,
  type ApiUsageLog,
  type CreatorEarning,
  type CreateCharacterAssetInput,
  type UpdateCharacterAssetInput,
  type SubmitAssetForReviewInput,
  type ReviewAssetInput,
  type CreateCuratedCollectionInput,
  type UpdateCuratedCollectionInput,
  type CreateAssetReviewInput,
  type UpdateAssetReviewInput,
  type CreateApiKeyInput,
  type CreatePurchaseInput,
  type CreateVersionInput,
  type CreatePayoutRequestInput,
  type PayoutMethod,
  type MarketplaceSearchOptions,
  type MarketplaceSearchResult,
  // Error classes
  AssetNotFoundError,
  CollectionNotFoundError,
  ApiKeyNotFoundError,
  InvalidApiKeyError,
  RateLimitExceededError,
  InsufficientPermissionsError,
} from './marketplace'
