import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  CharacterAsset,
  AssetDownload,
  CreateCharacterAssetInput,
  UpdateCharacterAssetInput,
  MarketplaceSearchOptions,
  MarketplaceSearchResult,
  AssetNotFoundError,
  DatabaseError,
  mapCharacterAsset,
  mapCharacterAssets,
  mapAssetDownloads,
} from './types'

export class AssetsService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async searchAssets(options: MarketplaceSearchOptions = {}): Promise<MarketplaceSearchResult> {
    try {
      const {
        query, assetType, category, tags, licenseType, isFree, isFeatured, isCurated,
        sortBy = 'downloads', sortOrder = 'desc', page = 1, pageSize = 20,
      } = options

      let queryBuilder = this.supabase
        .from('character_assets')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .eq('approval_status', 'approved')

      if (query) queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      if (assetType) queryBuilder = queryBuilder.eq('asset_type', assetType)
      if (category) queryBuilder = queryBuilder.eq('category', category)
      if (tags && tags.length > 0) queryBuilder = queryBuilder.overlaps('tags', tags)
      if (licenseType) queryBuilder = queryBuilder.eq('license_type', licenseType)
      if (isFree !== undefined) queryBuilder = queryBuilder.eq('is_free', isFree)
      if (isFeatured !== undefined) queryBuilder = queryBuilder.eq('is_featured', isFeatured)
      if (isCurated !== undefined) queryBuilder = queryBuilder.eq('is_curated', isCurated)

      const sortColumn = sortBy === 'newest' ? 'created_at' : sortBy
      queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      queryBuilder = queryBuilder.range(from, from + pageSize - 1)

      const { data, error, count } = await queryBuilder
      if (error) throw new DatabaseError(error.message)

      const total = count || 0
      return { assets: mapCharacterAssets(data || []), total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to search assets')
    }
  }

  async getAsset(id: string): Promise<CharacterAsset | null> {
    try {
      const { data, error } = await this.supabase.from('character_assets').select('*').eq('id', id).single()
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }
      return mapCharacterAsset(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch asset')
    }
  }

  async getAssetBySlug(slug: string): Promise<CharacterAsset | null> {
    try {
      const { data, error } = await this.supabase
        .from('character_assets').select('*').eq('slug', slug).eq('is_published', true).eq('approval_status', 'approved').single()
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }
      return mapCharacterAsset(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch asset by slug')
    }
  }

  async getCreatorAssets(creatorId: string): Promise<CharacterAsset[]> {
    try {
      const { data, error } = await this.supabase
        .from('character_assets').select('*').eq('creator_id', creatorId).order('updated_at', { ascending: false })
      if (error) throw new DatabaseError(error.message)
      return mapCharacterAssets(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch creator assets')
    }
  }

  async createAsset(input: CreateCharacterAssetInput): Promise<CharacterAsset> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const slug = await this.generateAssetSlug(input.name)
      const { data, error } = await (this.supabase.from('character_assets') as any)
        .insert({
          creator_id: user.id, name: input.name, description: input.description, slug,
          asset_type: input.assetType, thumbnail_url: input.thumbnailUrl || null,
          preview_images: input.previewImages || [], character_data: input.characterData || null,
          prompt_template: input.promptTemplate || null,
          story_template_data: input.storyTemplateData || null,
          tags: input.tags || [],
          category: input.category, license_type: input.licenseType || 'free',
          is_free: input.isFree !== false, price: input.price || 0,
          royalty_percentage: input.royaltyPercentage || 0, approval_status: 'draft',
          demo_url: input.demoUrl || null,
          documentation: input.documentation || null,
          compatibility_info: input.compatibilityInfo || null,
        }).select().single()

      if (error) throw new DatabaseError(error.message)
      return mapCharacterAsset(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create asset')
    }
  }

  async updateAsset(id: string, input: UpdateCharacterAssetInput): Promise<CharacterAsset> {
    try {
      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.assetType !== undefined) updateData.asset_type = input.assetType
      if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl
      if (input.previewImages !== undefined) updateData.preview_images = input.previewImages
      if (input.characterData !== undefined) updateData.character_data = input.characterData
      if (input.promptTemplate !== undefined) updateData.prompt_template = input.promptTemplate
      if (input.storyTemplateData !== undefined) updateData.story_template_data = input.storyTemplateData
      if (input.tags !== undefined) updateData.tags = input.tags
      if (input.category !== undefined) updateData.category = input.category
      if (input.licenseType !== undefined) updateData.license_type = input.licenseType
      if (input.isFree !== undefined) updateData.is_free = input.isFree
      if (input.price !== undefined) updateData.price = input.price
      if (input.royaltyPercentage !== undefined) updateData.royalty_percentage = input.royaltyPercentage
      if (input.isPublished !== undefined) {
        updateData.is_published = input.isPublished
        if (input.isPublished) updateData.published_at = new Date().toISOString()
      }
      if (input.version !== undefined) updateData.version = input.version
      if (input.versionNotes !== undefined) updateData.version_notes = input.versionNotes
      if (input.demoUrl !== undefined) updateData.demo_url = input.demoUrl
      if (input.documentation !== undefined) updateData.documentation = input.documentation
      if (input.compatibilityInfo !== undefined) updateData.compatibility_info = input.compatibilityInfo
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await (this.supabase.from('character_assets') as any)
        .update(updateData).eq('id', id).select().single()
      if (error) {
        if (error.code === 'PGRST116') throw new AssetNotFoundError(id)
        throw new DatabaseError(error.message)
      }
      return mapCharacterAsset(data)
    } catch (error) {
      if (error instanceof AssetNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update asset')
    }
  }

  async deleteAsset(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.from('character_assets').delete().eq('id', id)
      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete asset')
    }
  }

  async submitForReview(id: string): Promise<CharacterAsset> {
    try {
      const { data, error } = await (this.supabase.from('character_assets') as any)
        .update({ approval_status: 'pending_review', updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) {
        if (error.code === 'PGRST116') throw new AssetNotFoundError(id)
        throw new DatabaseError(error.message)
      }
      return mapCharacterAsset(data)
    } catch (error) {
      if (error instanceof AssetNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to submit asset for review')
    }
  }

  async reviewAsset(id: string, status: 'approved' | 'rejected' | 'needs_changes', notes?: string): Promise<CharacterAsset> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const updateData: any = {
        approval_status: status, approval_notes: notes || null,
        approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      if (status === 'approved') {
        updateData.is_published = true
        updateData.published_at = new Date().toISOString()
      }

      const { data, error } = await (this.supabase.from('character_assets') as any)
        .update(updateData).eq('id', id).select().single()
      if (error) {
        if (error.code === 'PGRST116') throw new AssetNotFoundError(id)
        throw new DatabaseError(error.message)
      }
      return mapCharacterAsset(data)
    } catch (error) {
      if (error instanceof AssetNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to review asset')
    }
  }

  async getPendingReviewAssets(): Promise<CharacterAsset[]> {
    try {
      const { data, error } = await this.supabase
        .from('character_assets').select('*').eq('approval_status', 'pending_review').order('created_at', { ascending: true })
      if (error) throw new DatabaseError(error.message)
      return mapCharacterAssets(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch pending review assets')
    }
  }

  async downloadAsset(assetId: string, storyStackId?: string): Promise<CharacterAsset> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      await (this.supabase.from('asset_downloads') as any).upsert({
        asset_id: assetId, user_id: user.id, story_stack_id: storyStackId || null, downloaded_at: new Date().toISOString(),
      })
      await this.supabase.rpc('increment_asset_downloads', { p_asset_id: assetId })

      const asset = await this.getAsset(assetId)
      if (!asset) throw new AssetNotFoundError(assetId)
      return asset
    } catch (error) {
      if (error instanceof AssetNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to download asset')
    }
  }

  async getUserDownloads(): Promise<AssetDownload[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await this.supabase
        .from('asset_downloads').select('*').eq('user_id', user.id).order('downloaded_at', { ascending: false })
      if (error) throw new DatabaseError(error.message)
      return mapAssetDownloads(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch downloads')
    }
  }

  async generateAssetSlug(name: string): Promise<string> {
    let baseSlug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
    if (!baseSlug) baseSlug = 'asset'

    let slug = baseSlug
    let counter = 1
    while (true) {
      const { data } = await this.supabase.from('character_assets').select('id').eq('slug', slug).maybeSingle()
      if (!data) return slug
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }
}
