// Generated Supabase Database Types
// Based on database schema from migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PreviewThemeJson = {
  fontFamily?: string
  titleFont?: string
  borderRadius?: string
  borderStyle?: string
  borderWidth?: number
  messageBackground?: string
  messageTextColor?: string
  messageBorderColor?: string
  choiceBackground?: string
  choiceTextColor?: string
  choiceBorderColor?: string
  choiceHoverBackground?: string
  accentColor?: string
  shadowStyle?: string
  overlayOpacity?: number
}

export type CharacterDataJson = {
  name?: string
  appearance?: string
  imageUrls?: string[]
  imagePrompts?: string[]
  avatarUrl?: string
  avatarPrompt?: string
}

export type PromptTemplateJson = {
  template?: string
  variables?: string[]
  category?: string
  style?: string
}

export type StoryTemplateDataJson = {
  storyStack?: Json
  storyCards?: Json[]
  choices?: Json[]
}

export type CompatibilityInfoJson = {
  minVersion?: string
  features?: string[]
}

export type PayoutDetailsJson = {
  accountNumber?: string
  routingNumber?: string
  paypalEmail?: string
}

export type BundleDataJson = Json

export type ReorderCardsResult = {
  success: boolean
  updated_count: number
  idempotent: boolean
  message: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      story_stacks: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          is_published: boolean
          published_at: string | null
          slug: string | null
          first_card_id: string | null
          art_style_id: string | null
          custom_art_style_prompt: string | null
          art_style_source: 'preset' | 'custom' | 'extracted'
          extracted_style_image_url: string | null
          cover_image_url: string | null
          preview_theme: PreviewThemeJson | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          is_published?: boolean
          published_at?: string | null
          slug?: string | null
          first_card_id?: string | null
          art_style_id?: string | null
          custom_art_style_prompt?: string | null
          art_style_source?: 'preset' | 'custom' | 'extracted'
          extracted_style_image_url?: string | null
          cover_image_url?: string | null
          preview_theme?: PreviewThemeJson | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          is_published?: boolean
          published_at?: string | null
          slug?: string | null
          first_card_id?: string | null
          art_style_id?: string | null
          custom_art_style_prompt?: string | null
          art_style_source?: 'preset' | 'custom' | 'extracted'
          extracted_style_image_url?: string | null
          cover_image_url?: string | null
          preview_theme?: PreviewThemeJson | null
          created_at?: string
          updated_at?: string
        }
      }
      story_cards: {
        Row: {
          id: string
          story_stack_id: string
          title: string
          content: string
          script: string
          image_url: string | null
          image_prompt: string | null
          image_description: string | null
          audio_url: string | null
          message: string | null
          speaker: string | null
          speaker_type: string | null
          order_index: number
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_stack_id: string
          title?: string
          content?: string
          script?: string
          image_url?: string | null
          image_prompt?: string | null
          image_description?: string | null
          audio_url?: string | null
          message?: string | null
          speaker?: string | null
          speaker_type?: string | null
          order_index?: number
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_stack_id?: string
          title?: string
          content?: string
          script?: string
          image_url?: string | null
          image_prompt?: string | null
          image_description?: string | null
          audio_url?: string | null
          message?: string | null
          speaker?: string | null
          speaker_type?: string | null
          order_index?: number
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      choices: {
        Row: {
          id: string
          story_card_id: string
          label: string
          target_card_id: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_card_id: string
          label: string
          target_card_id?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_card_id?: string
          label?: string
          target_card_id?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          story_stack_id: string
          name: string
          appearance: string
          image_urls: string[]
          image_prompts: string[]
          avatar_url: string | null
          avatar_prompt: string | null
          order_index: number
          bria_project_id: string | null
          bria_dataset_id: string | null
          bria_model_id: string | null
          bria_model_status: 'none' | 'pending' | 'training' | 'completed' | 'failed'
          bria_caption_prefix: string | null
          bria_training_started_at: string | null
          bria_training_completed_at: string | null
          bria_error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_stack_id: string
          name: string
          appearance?: string
          image_urls?: string[]
          image_prompts?: string[]
          avatar_url?: string | null
          avatar_prompt?: string | null
          order_index?: number
          bria_project_id?: string | null
          bria_dataset_id?: string | null
          bria_model_id?: string | null
          bria_model_status?: 'none' | 'pending' | 'training' | 'completed' | 'failed'
          bria_caption_prefix?: string | null
          bria_training_started_at?: string | null
          bria_training_completed_at?: string | null
          bria_error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_stack_id?: string
          name?: string
          appearance?: string
          image_urls?: string[]
          image_prompts?: string[]
          avatar_url?: string | null
          avatar_prompt?: string | null
          order_index?: number
          bria_project_id?: string | null
          bria_dataset_id?: string | null
          bria_model_id?: string | null
          bria_model_status?: 'none' | 'pending' | 'training' | 'completed' | 'failed'
          bria_caption_prefix?: string | null
          bria_training_started_at?: string | null
          bria_training_completed_at?: string | null
          bria_error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      character_cards: {
        Row: {
          id: string
          story_stack_id: string
          character_id: string
          title: string | null
          content: string | null
          image_index: number
          show_avatar: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_stack_id: string
          character_id: string
          title?: string | null
          content?: string | null
          image_index?: number
          show_avatar?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_stack_id?: string
          character_id?: string
          title?: string | null
          content?: string | null
          image_index?: number
          show_avatar?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      character_assets: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string
          slug: string
          asset_type: 'character' | 'prompt_template' | 'avatar_set' | 'character_pack' | 'story_template'
          thumbnail_url: string | null
          preview_images: string[]
          character_data: CharacterDataJson | null
          prompt_template: PromptTemplateJson | null
          story_template_data: StoryTemplateDataJson | null
          tags: string[]
          category: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'anime' | 'realistic' | 'cartoon' | 'other'
          license_type: 'free' | 'attribution' | 'non-commercial' | 'commercial' | 'exclusive'
          is_free: boolean
          price: number
          royalty_percentage: number
          downloads: number
          rating: number
          rating_count: number
          view_count: number
          is_published: boolean
          is_featured: boolean
          is_curated: boolean
          approval_status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_changes'
          approval_notes: string | null
          approved_by: string | null
          approved_at: string | null
          version: string
          version_notes: string | null
          previous_version_id: string | null
          is_latest_version: boolean
          demo_url: string | null
          documentation: string | null
          compatibility_info: CompatibilityInfoJson | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description: string
          slug: string
          asset_type: 'character' | 'prompt_template' | 'avatar_set' | 'character_pack' | 'story_template'
          thumbnail_url?: string | null
          preview_images?: string[]
          character_data?: CharacterDataJson | null
          prompt_template?: PromptTemplateJson | null
          story_template_data?: StoryTemplateDataJson | null
          tags?: string[]
          category: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'anime' | 'realistic' | 'cartoon' | 'other'
          license_type?: 'free' | 'attribution' | 'non-commercial' | 'commercial' | 'exclusive'
          is_free?: boolean
          price?: number
          royalty_percentage?: number
          downloads?: number
          rating?: number
          rating_count?: number
          view_count?: number
          is_published?: boolean
          is_featured?: boolean
          is_curated?: boolean
          approval_status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_changes'
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          version?: string
          version_notes?: string | null
          previous_version_id?: string | null
          is_latest_version?: boolean
          demo_url?: string | null
          documentation?: string | null
          compatibility_info?: CompatibilityInfoJson | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          description?: string
          slug?: string
          asset_type?: 'character' | 'prompt_template' | 'avatar_set' | 'character_pack' | 'story_template'
          thumbnail_url?: string | null
          preview_images?: string[]
          character_data?: CharacterDataJson | null
          prompt_template?: PromptTemplateJson | null
          story_template_data?: StoryTemplateDataJson | null
          tags?: string[]
          category?: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'anime' | 'realistic' | 'cartoon' | 'other'
          license_type?: 'free' | 'attribution' | 'non-commercial' | 'commercial' | 'exclusive'
          is_free?: boolean
          price?: number
          royalty_percentage?: number
          downloads?: number
          rating?: number
          rating_count?: number
          view_count?: number
          is_published?: boolean
          is_featured?: boolean
          is_curated?: boolean
          approval_status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_changes'
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          version?: string
          version_notes?: string | null
          previous_version_id?: string | null
          is_latest_version?: boolean
          demo_url?: string | null
          documentation?: string | null
          compatibility_info?: CompatibilityInfoJson | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      curated_collections: {
        Row: {
          id: string
          curator_id: string | null
          name: string
          description: string
          slug: string
          thumbnail_url: string | null
          collection_type: 'featured' | 'staff_picks' | 'themed' | 'seasonal' | 'new_creators'
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          curator_id?: string | null
          name: string
          description: string
          slug: string
          thumbnail_url?: string | null
          collection_type: 'featured' | 'staff_picks' | 'themed' | 'seasonal' | 'new_creators'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          curator_id?: string | null
          name?: string
          description?: string
          slug?: string
          thumbnail_url?: string | null
          collection_type?: 'featured' | 'staff_picks' | 'themed' | 'seasonal' | 'new_creators'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collection_assets: {
        Row: {
          id: string
          collection_id: string
          asset_id: string
          display_order: number
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          asset_id: string
          display_order?: number
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          asset_id?: string
          display_order?: number
          added_at?: string
        }
      }
      asset_downloads: {
        Row: {
          id: string
          asset_id: string
          user_id: string
          story_stack_id: string | null
          downloaded_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          user_id: string
          story_stack_id?: string | null
          downloaded_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          user_id?: string
          story_stack_id?: string | null
          downloaded_at?: string
        }
      }
      asset_reviews: {
        Row: {
          id: string
          asset_id: string
          user_id: string
          rating: number
          review_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          user_id: string
          rating: number
          review_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          user_id?: string
          rating?: number
          review_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      marketplace_api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[]
          rate_limit: number
          is_active: boolean
          last_used_at: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes?: string[]
          rate_limit?: number
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          scopes?: string[]
          rate_limit?: number
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
      api_usage_logs: {
        Row: {
          id: string
          api_key_id: string | null
          user_id: string | null
          endpoint: string
          method: string
          asset_id: string | null
          response_status: number | null
          response_time_ms: number | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          api_key_id?: string | null
          user_id?: string | null
          endpoint: string
          method: string
          asset_id?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          api_key_id?: string | null
          user_id?: string | null
          endpoint?: string
          method?: string
          asset_id?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      creator_earnings: {
        Row: {
          id: string
          creator_id: string
          asset_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'paid' | 'failed'
          paid_at: string | null
          payout_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          asset_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          paid_at?: string | null
          payout_reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          asset_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          paid_at?: string | null
          payout_reference?: string | null
          created_at?: string
        }
      }
      asset_purchases: {
        Row: {
          id: string
          asset_id: string | null
          user_id: string
          price_paid: number
          currency: string
          creator_amount: number
          platform_amount: number
          payment_provider: string
          payment_intent_id: string | null
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          license_type: string
          license_key: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          asset_id?: string | null
          user_id: string
          price_paid: number
          currency?: string
          creator_amount: number
          platform_amount: number
          payment_provider?: string
          payment_intent_id?: string | null
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          license_type: string
          license_key?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          asset_id?: string | null
          user_id?: string
          price_paid?: number
          currency?: string
          creator_amount?: number
          platform_amount?: number
          payment_provider?: string
          payment_intent_id?: string | null
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          license_type?: string
          license_key?: string
          created_at?: string
          completed_at?: string | null
        }
      }
      asset_versions: {
        Row: {
          id: string
          asset_id: string
          version: string
          version_notes: string | null
          asset_data: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          version: string
          version_notes?: string | null
          asset_data: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          version?: string
          version_notes?: string | null
          asset_data?: Json
          created_by?: string | null
          created_at?: string
        }
      }
      payout_requests: {
        Row: {
          id: string
          creator_id: string
          amount: number
          currency: string
          payout_method: 'bank_transfer' | 'paypal' | 'stripe_connect'
          payout_details: PayoutDetailsJson | null
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          processed_at: string | null
          processed_by: string | null
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          amount: number
          currency?: string
          payout_method?: 'bank_transfer' | 'paypal' | 'stripe_connect'
          payout_details?: PayoutDetailsJson | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          amount?: number
          currency?: string
          payout_method?: 'bank_transfer' | 'paypal' | 'stripe_connect'
          payout_details?: PayoutDetailsJson | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shared_story_bundles: {
        Row: {
          id: string
          story_stack_id: string
          user_id: string
          share_code: string
          bundle_data: BundleDataJson
          bundle_version: string
          bundle_checksum: string
          bundle_size_bytes: number
          story_name: string
          story_description: string | null
          card_count: number
          choice_count: number
          character_count: number
          view_count: number
          created_at: string
          updated_at: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          story_stack_id: string
          user_id: string
          share_code: string
          bundle_data: BundleDataJson
          bundle_version: string
          bundle_checksum: string
          bundle_size_bytes: number
          story_name: string
          story_description?: string | null
          card_count?: number
          choice_count?: number
          character_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          story_stack_id?: string
          user_id?: string
          share_code?: string
          bundle_data?: BundleDataJson
          bundle_version?: string
          bundle_checksum?: string
          bundle_size_bytes?: number
          story_name?: string
          story_description?: string | null
          card_count?: number
          choice_count?: number
          character_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
      }
      card_reorder_idempotency: {
        Row: {
          id: string
          idempotency_key: string
          story_stack_id: string
          card_count: number
          created_at: string
        }
        Insert: {
          id?: string
          idempotency_key: string
          story_stack_id: string
          card_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          idempotency_key?: string
          story_stack_id?: string
          card_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_asset_downloads: {
        Args: { p_asset_id: string }
        Returns: undefined
      }
      generate_story_slug: {
        Args: { story_name: string; story_id: string }
        Returns: string
      }
      generate_asset_slug: {
        Args: { asset_name: string; asset_id: string }
        Returns: string
      }
      generate_collection_slug: {
        Args: { collection_name: string; collection_id: string }
        Returns: string
      }
      generate_share_code: {
        Args: Record<string, never>
        Returns: string
      }
      get_creator_balance: {
        Args: { p_creator_id: string }
        Returns: number
      }
      record_asset_purchase: {
        Args: { p_asset_id: string; p_user_id: string; p_price: number; p_payment_intent_id: string }
        Returns: string
      }
      create_asset_version: {
        Args: { p_asset_id: string; p_version: string; p_version_notes?: string }
        Returns: string
      }
      reorder_story_cards: {
        Args: { p_story_stack_id: string; p_card_orders: Json; p_idempotency_key?: string | null }
        Returns: ReorderCardsResult
      }
      cleanup_old_idempotency_records: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for accessing table rows
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used row types
export type StoryStackRow = Tables<'story_stacks'>
export type StoryCardRow = Tables<'story_cards'>
export type ChoiceRow = Tables<'choices'>
export type CharacterRow = Tables<'characters'>
export type CharacterCardRow = Tables<'character_cards'>
export type CharacterAssetRow = Tables<'character_assets'>
export type CuratedCollectionRow = Tables<'curated_collections'>
export type CollectionAssetRow = Tables<'collection_assets'>
export type AssetDownloadRow = Tables<'asset_downloads'>
export type AssetReviewRow = Tables<'asset_reviews'>
export type MarketplaceApiKeyRow = Tables<'marketplace_api_keys'>
export type CreatorEarningRow = Tables<'creator_earnings'>
export type AssetPurchaseRow = Tables<'asset_purchases'>
export type AssetVersionRow = Tables<'asset_versions'>
export type PayoutRequestRow = Tables<'payout_requests'>
export type SharedStoryBundleRow = Tables<'shared_story_bundles'>
export type ProfileRow = Tables<'profiles'>

// Update types
export type StoryStackUpdate = UpdateTables<'story_stacks'>
export type StoryCardUpdate = UpdateTables<'story_cards'>
export type ChoiceUpdate = UpdateTables<'choices'>
export type CharacterUpdate = UpdateTables<'characters'>
export type CharacterCardUpdate = UpdateTables<'character_cards'>
export type CharacterAssetUpdate = UpdateTables<'character_assets'>
export type CuratedCollectionUpdate = UpdateTables<'curated_collections'>
export type AssetReviewUpdate = UpdateTables<'asset_reviews'>
export type PayoutRequestUpdate = UpdateTables<'payout_requests'>

// Insert types
export type StoryStackInsert = InsertTables<'story_stacks'>
export type StoryCardInsert = InsertTables<'story_cards'>
export type ChoiceInsert = InsertTables<'choices'>
export type CharacterInsert = InsertTables<'characters'>
export type CharacterCardInsert = InsertTables<'character_cards'>
export type CharacterAssetInsert = InsertTables<'character_assets'>
export type CuratedCollectionInsert = InsertTables<'curated_collections'>
export type CollectionAssetInsert = InsertTables<'collection_assets'>
export type AssetDownloadInsert = InsertTables<'asset_downloads'>
export type AssetReviewInsert = InsertTables<'asset_reviews'>
