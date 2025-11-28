'use client'

import { useCallback } from 'react'
import {
  CreatorBalance,
  CreatorEarning,
  PayoutRequest,
} from '@/lib/types'

interface UseEarningsOptions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useEarnings({ setLoading, setError }: UseEarningsOptions) {
  // Get earnings and balance
  const getEarnings = useCallback(async (): Promise<{
    earnings: CreatorEarning[]
    balance: CreatorBalance
  } | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/marketplace/earnings')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch earnings')
      return { earnings: data.earnings, balance: data.balance }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings')
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  // Get payout requests
  const getPayouts = useCallback(async (): Promise<PayoutRequest[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/marketplace/payouts')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch payouts')
      return data.payouts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payouts')
      return []
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  // Request payout
  const requestPayout = useCallback(async (
    amount: number,
    payoutMethod: string,
    payoutDetails?: Record<string, unknown>
  ): Promise<PayoutRequest | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/marketplace/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, payoutMethod, payoutDetails }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to request payout')
      return data.payout
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout')
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  // Cancel payout request
  const cancelPayout = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/marketplace/payouts/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel payout')
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel payout')
      return false
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  return {
    getEarnings,
    getPayouts,
    requestPayout,
    cancelPayout,
  }
}
