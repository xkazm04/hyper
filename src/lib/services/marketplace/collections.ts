import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  CharacterAsset,
  CuratedCollection,
  CreateCuratedCollectionInput,
  DatabaseError,
  mapCharacterAssets,
  mapCuratedCollection,
  mapCuratedCollections,
} from './types'

export class CollectionsService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async getCollections(): Promise<CuratedCollection[]> {
    try {
      const { data, error } = await this.supabase
        .from('curated_collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return mapCuratedCollections(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch collections')
    }
  }

  async getCollectionBySlug(slug: string): Promise<CuratedCollection | null> {
    try {
      const { data, error } = await this.supabase
        .from('curated_collections')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }

      return mapCuratedCollection(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch collection')
    }
  }

  async getCollectionAssets(collectionId: string): Promise<CharacterAsset[]> {
    try {
      const { data, error } = await this.supabase
        .from('collection_assets')
        .select(`
          asset_id,
          display_order,
          character_assets (*)
        `)
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true })

      if (error) throw new DatabaseError(error.message)

      const assets = (data || [])
        .map((item: any) => item.character_assets)
        .filter((asset: any) => asset !== null)

      return mapCharacterAssets(assets)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch collection assets')
    }
  }

  async createCollection(input: CreateCuratedCollectionInput): Promise<CuratedCollection> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const slug = await this.generateCollectionSlug(input.name)

      const { data, error } = await (this.supabase
        .from('curated_collections') as any)
        .insert({
          curator_id: user.id,
          name: input.name,
          description: input.description,
          slug,
          thumbnail_url: input.thumbnailUrl || null,
          collection_type: input.collectionType,
          display_order: input.displayOrder || 0,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapCuratedCollection(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create collection')
    }
  }

  async addAssetToCollection(collectionId: string, assetId: string, displayOrder?: number): Promise<void> {
    try {
      const { error } = await (this.supabase
        .from('collection_assets') as any)
        .insert({
          collection_id: collectionId,
          asset_id: assetId,
          display_order: displayOrder || 0,
        })

      if (error) throw new DatabaseError(error.message)

      await (this.supabase.from('character_assets') as any)
        .update({ is_curated: true })
        .eq('id', assetId)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to add asset to collection')
    }
  }

  async removeAssetFromCollection(collectionId: string, assetId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('collection_assets')
        .delete()
        .eq('collection_id', collectionId)
        .eq('asset_id', assetId)

      if (error) throw new DatabaseError(error.message)

      const { data: remaining } = await this.supabase
        .from('collection_assets')
        .select('id')
        .eq('asset_id', assetId)
        .limit(1)

      if (!remaining || remaining.length === 0) {
        await (this.supabase.from('character_assets') as any)
          .update({ is_curated: false })
          .eq('id', assetId)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to remove asset from collection')
    }
  }

  async generateCollectionSlug(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!baseSlug) baseSlug = 'collection'

    let slug = baseSlug
    let counter = 1

    while (true) {
      const { data } = await this.supabase
        .from('curated_collections')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (!data) return slug

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }
}
