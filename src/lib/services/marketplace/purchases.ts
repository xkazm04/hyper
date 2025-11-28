import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  AssetPurchase,
  AssetVersion,
  PayoutRequest,
  CreatorEarning,
  CreatorBalance,
  CreatePayoutRequestInput,
  mapAssetPurchase,
  mapAssetPurchases,
  mapAssetVersion,
  mapAssetVersions,
  mapPayoutRequest,
  mapPayoutRequests,
  mapCreatorEarning,
  mapCreatorEarnings,
  DatabaseError,
  AssetNotFoundError,
} from './types'

export class PurchasesService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  // ============================================================================
  // Purchase Operations
  // ============================================================================

  async recordPurchase(
    assetId: string,
    paymentIntentId: string
  ): Promise<AssetPurchase> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      // Call the database function to record the purchase
      const { data, error } = await this.supabase.rpc('record_asset_purchase', {
        p_asset_id: assetId,
        p_user_id: user.id,
        p_price: 0, // Will be fetched from asset in the function
        p_payment_intent_id: paymentIntentId,
      })

      if (error) throw new DatabaseError(error.message)

      // Fetch the created purchase
      const purchase = await this.getPurchase(data)
      if (!purchase) throw new DatabaseError('Failed to retrieve purchase')

      return purchase
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to record purchase')
    }
  }

  async getPurchase(id: string): Promise<AssetPurchase | null> {
    try {
      const { data, error } = await this.supabase
        .from('asset_purchases')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }
      return mapAssetPurchase(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch purchase')
    }
  }

  async getUserPurchases(): Promise<AssetPurchase[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await this.supabase
        .from('asset_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapAssetPurchases(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch purchases')
    }
  }

  async getAssetPurchases(assetId: string): Promise<AssetPurchase[]> {
    try {
      const { data, error } = await this.supabase
        .from('asset_purchases')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapAssetPurchases(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch asset purchases')
    }
  }

  async hasUserPurchased(assetId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await this.supabase
        .from('asset_purchases')
        .select('id')
        .eq('asset_id', assetId)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .maybeSingle()

      if (error) throw new DatabaseError(error.message)
      return !!data
    } catch (error) {
      return false
    }
  }

  // ============================================================================
  // Version Operations
  // ============================================================================

  async createVersion(
    assetId: string,
    version: string,
    versionNotes?: string
  ): Promise<AssetVersion> {
    try {
      // Call the database function to create a version
      const { data, error } = await this.supabase.rpc('create_asset_version', {
        p_asset_id: assetId,
        p_version: version,
        p_version_notes: versionNotes || null,
      })

      if (error) throw new DatabaseError(error.message)

      // Fetch the created version
      const createdVersion = await this.getVersion(data)
      if (!createdVersion) throw new DatabaseError('Failed to retrieve version')

      return createdVersion
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create version')
    }
  }

  async getVersion(id: string): Promise<AssetVersion | null> {
    try {
      const { data, error } = await this.supabase
        .from('asset_versions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }
      return mapAssetVersion(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch version')
    }
  }

  async getAssetVersions(assetId: string): Promise<AssetVersion[]> {
    try {
      const { data, error } = await this.supabase
        .from('asset_versions')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapAssetVersions(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch asset versions')
    }
  }

  // ============================================================================
  // Earnings Operations
  // ============================================================================

  async getCreatorEarnings(): Promise<CreatorEarning[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await this.supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapCreatorEarnings(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch earnings')
    }
  }

  async getCreatorBalance(): Promise<CreatorBalance> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      // Get pending earnings
      const { data: pendingEarnings, error: earningsError } = await this.supabase
        .from('creator_earnings')
        .select('amount')
        .eq('creator_id', user.id)
        .eq('status', 'pending')

      if (earningsError) throw new DatabaseError(earningsError.message)

      // Get total earnings
      const { data: allEarnings, error: allError } = await this.supabase
        .from('creator_earnings')
        .select('amount, status')
        .eq('creator_id', user.id)

      if (allError) throw new DatabaseError(allError.message)

      // Get completed payouts
      const { data: payouts, error: payoutError } = await this.supabase
        .from('payout_requests')
        .select('amount')
        .eq('creator_id', user.id)
        .eq('status', 'completed')

      if (payoutError) throw new DatabaseError(payoutError.message)

      const pendingAmount = (pendingEarnings || []).reduce(
        (sum, e) => sum + parseFloat(e.amount),
        0
      )
      const totalEarned = (allEarnings || []).reduce(
        (sum, e) => sum + parseFloat(e.amount),
        0
      )
      const totalPaidOut = (payouts || []).reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      )

      return {
        availableBalance: pendingAmount,
        pendingEarnings: pendingAmount,
        totalEarned,
        totalPaidOut,
        currency: 'USD',
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch balance')
    }
  }

  // ============================================================================
  // Payout Operations
  // ============================================================================

  async getPayoutRequests(): Promise<PayoutRequest[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await this.supabase
        .from('payout_requests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapPayoutRequests(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch payout requests')
    }
  }

  async createPayoutRequest(input: CreatePayoutRequestInput): Promise<PayoutRequest> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      // Validate balance
      const balance = await this.getCreatorBalance()
      if (input.amount > balance.availableBalance) {
        throw new DatabaseError('Insufficient balance')
      }

      const { data, error } = await (this.supabase.from('payout_requests') as any)
        .insert({
          creator_id: user.id,
          amount: input.amount,
          payout_method: input.payoutMethod,
          payout_details: input.payoutDetails || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapPayoutRequest(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create payout request')
    }
  }

  async cancelPayoutRequest(id: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { error } = await this.supabase
        .from('payout_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('creator_id', user.id)
        .eq('status', 'pending')

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to cancel payout request')
    }
  }
}
