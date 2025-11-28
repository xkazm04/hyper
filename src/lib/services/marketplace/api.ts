import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import crypto from 'crypto'
import {
  MarketplaceApiKey,
  CreateApiKeyInput,
  InvalidApiKeyError,
  DatabaseError,
  mapApiKey,
  mapApiKeys,
} from './types'

export class ApiService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: MarketplaceApiKey; rawKey: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const rawKey = `hyper_sk_${crypto.randomBytes(32).toString('hex')}`
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
      const keyPrefix = rawKey.substring(0, 16)

      const { data, error } = await (this.supabase
        .from('marketplace_api_keys') as any)
        .insert({
          user_id: user.id,
          name: input.name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes: input.scopes || ['read:assets'],
          rate_limit: input.rateLimit || 1000,
          expires_at: input.expiresAt || null,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)

      return {
        apiKey: mapApiKey(data),
        rawKey,
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create API key')
    }
  }

  async getApiKeys(): Promise<MarketplaceApiKey[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await this.supabase
        .from('marketplace_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw new DatabaseError(error.message)
      return mapApiKeys(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch API keys')
    }
  }

  async revokeApiKey(id: string): Promise<void> {
    try {
      const { error } = await (this.supabase
        .from('marketplace_api_keys') as any)
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to revoke API key')
    }
  }

  async validateApiKey(rawKey: string): Promise<MarketplaceApiKey> {
    try {
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

      const { data, error } = await this.supabase
        .from('marketplace_api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        throw new InvalidApiKeyError()
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new InvalidApiKeyError('API key has expired')
      }

      await (this.supabase.from('marketplace_api_keys') as any)
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id)

      return mapApiKey(data)
    } catch (error) {
      if (error instanceof InvalidApiKeyError) throw error
      throw new InvalidApiKeyError()
    }
  }

  hasScope(apiKey: MarketplaceApiKey, requiredScope: string): boolean {
    return apiKey.scopes.includes(requiredScope)
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
    try {
      const { data: keyData } = await this.supabase
        .from('marketplace_api_keys')
        .select('user_id')
        .eq('id', apiKeyId)
        .single()

      await (this.supabase.from('api_usage_logs') as any).insert({
        api_key_id: apiKeyId,
        user_id: keyData?.user_id || null,
        endpoint,
        method,
        asset_id: assetId || null,
        response_status: responseStatus || null,
        response_time_ms: responseTimeMs || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })
    } catch (error) {
      console.error('Failed to log API usage:', error)
    }
  }
}
