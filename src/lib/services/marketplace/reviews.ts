import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  AssetReview,
  CreateAssetReviewInput,
  UpdateAssetReviewInput,
  DatabaseError,
  mapAssetReview,
  mapAssetReviews,
} from './types'

export class ReviewsService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async getAssetReviews(assetId: string): Promise<AssetReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('asset_reviews')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapAssetReviews(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch reviews')
    }
  }

  async createReview(input: CreateAssetReviewInput): Promise<AssetReview> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await (this.supabase
        .from('asset_reviews') as any)
        .insert({
          asset_id: input.assetId,
          user_id: user.id,
          rating: input.rating,
          review_text: input.reviewText || null,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapAssetReview(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create review')
    }
  }

  async updateReview(id: string, input: UpdateAssetReviewInput): Promise<AssetReview> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (input.rating !== undefined) updateData.rating = input.rating
      if (input.reviewText !== undefined) updateData.review_text = input.reviewText

      const { data, error } = await (this.supabase
        .from('asset_reviews') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapAssetReview(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update review')
    }
  }

  async deleteReview(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('asset_reviews')
        .delete()
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete review')
    }
  }
}
