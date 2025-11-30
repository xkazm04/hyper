'use client'

import { useState, useCallback, useRef } from 'react'

/**
 * HTTP method types for API requests
 */
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

/**
 * Configuration for an API request
 */
interface ApiRequestConfig<TBody = unknown> {
  /** API endpoint path (e.g., '/api/marketplace/assets') */
  url: string
  /** HTTP method */
  method?: HttpMethod
  /** Request body (will be JSON stringified) */
  body?: TBody
  /** Query parameters to append to URL */
  params?: Record<string, string | number | boolean | undefined>
  /** Custom error message if request fails */
  errorMessage?: string
}

/**
 * Result of an API request
 */
interface ApiResult<TData> {
  data: TData | null
  error: string | null
  success: boolean
}

/**
 * State returned by the useMarketplaceApi hook
 */
interface MarketplaceApiState {
  loading: boolean
  error: string | null
}

/**
 * Functions returned by the useMarketplaceApi hook
 */
interface MarketplaceApiFunctions {
  /**
   * Execute a GET request
   * @param url - API endpoint
   * @param options - Optional configuration
   */
  get: <TData>(
    url: string,
    options?: Omit<ApiRequestConfig, 'url' | 'method' | 'body'>
  ) => Promise<ApiResult<TData>>

  /**
   * Execute a POST request
   * @param url - API endpoint
   * @param body - Request body
   * @param options - Optional configuration
   */
  post: <TData, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: Omit<ApiRequestConfig<TBody>, 'url' | 'method' | 'body'>
  ) => Promise<ApiResult<TData>>

  /**
   * Execute a PATCH request
   * @param url - API endpoint
   * @param body - Request body
   * @param options - Optional configuration
   */
  patch: <TData, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: Omit<ApiRequestConfig<TBody>, 'url' | 'method' | 'body'>
  ) => Promise<ApiResult<TData>>

  /**
   * Execute a DELETE request
   * @param url - API endpoint
   * @param options - Optional configuration
   */
  del: <TData = void>(
    url: string,
    options?: Omit<ApiRequestConfig, 'url' | 'method' | 'body'>
  ) => Promise<ApiResult<TData>>

  /**
   * Execute a request with full configuration control
   * @param config - Full request configuration
   */
  request: <TData, TBody = unknown>(
    config: ApiRequestConfig<TBody>
  ) => Promise<ApiResult<TData>>

  /**
   * Clear the current error state
   */
  clearError: () => void

  /**
   * Set loading state manually (useful for optimistic updates)
   */
  setLoading: (loading: boolean) => void
}

/**
 * Hook return type
 */
type UseMarketplaceApiReturn = MarketplaceApiState & MarketplaceApiFunctions

/**
 * Build URL with query parameters
 */
function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return baseUrl

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Extract error message from response data
 */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const errorData = data as { error: unknown }
    if (typeof errorData.error === 'string') {
      return errorData.error
    }
  }
  return fallback
}

/**
 * Shared hook for marketplace API operations.
 * Provides centralized fetch logic, error handling, and loading state management.
 *
 * @example
 * ```tsx
 * const { loading, error, get, post, del } = useMarketplaceApi()
 *
 * // GET request
 * const { data } = await get<Asset[]>('/api/marketplace/assets')
 *
 * // POST request with body
 * const { data } = await post<Asset>('/api/marketplace/assets', { name: 'New Asset' })
 *
 * // GET with query params
 * const { data } = await get<SearchResult>('/api/marketplace/assets', {
 *   params: { query: 'search term', page: 1 }
 * })
 * ```
 */
export function useMarketplaceApi(): UseMarketplaceApiReturn {
  const [loading, setLoadingState] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track active requests to prevent race conditions
  const activeRequestRef = useRef(0)

  const setLoading = useCallback((isLoading: boolean) => {
    setLoadingState(isLoading)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Core request function that all HTTP methods delegate to
   */
  const request = useCallback(
    async <TData, TBody = unknown>(
      config: ApiRequestConfig<TBody>
    ): Promise<ApiResult<TData>> => {
      const { url, method = 'GET', body, params, errorMessage } = config
      const requestId = ++activeRequestRef.current

      setLoadingState(true)
      setError(null)

      try {
        const fullUrl = buildUrl(url, params)

        const fetchOptions: RequestInit = {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        }

        const response = await fetch(fullUrl, fetchOptions)

        // For DELETE requests that return no content
        if (response.status === 204) {
          // Only update state if this is the most recent request
          if (requestId === activeRequestRef.current) {
            setLoadingState(false)
          }
          return { data: null as TData, error: null, success: true }
        }

        const data = await response.json()

        if (!response.ok) {
          const defaultError = errorMessage || `Request failed: ${method} ${url}`
          const errorMsg = extractErrorMessage(data, defaultError)

          // Only update state if this is the most recent request
          if (requestId === activeRequestRef.current) {
            setError(errorMsg)
            setLoadingState(false)
          }

          return { data: null, error: errorMsg, success: false }
        }

        // Only update state if this is the most recent request
        if (requestId === activeRequestRef.current) {
          setLoadingState(false)
        }

        return { data: data as TData, error: null, success: true }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : errorMessage || 'An unexpected error occurred'

        // Only update state if this is the most recent request
        if (requestId === activeRequestRef.current) {
          setError(errorMsg)
          setLoadingState(false)
        }

        return { data: null, error: errorMsg, success: false }
      }
    },
    []
  )

  const get = useCallback(
    <TData>(
      url: string,
      options?: Omit<ApiRequestConfig, 'url' | 'method' | 'body'>
    ): Promise<ApiResult<TData>> => {
      return request<TData>({ ...options, url, method: 'GET' })
    },
    [request]
  )

  const post = useCallback(
    <TData, TBody = unknown>(
      url: string,
      body?: TBody,
      options?: Omit<ApiRequestConfig<TBody>, 'url' | 'method' | 'body'>
    ): Promise<ApiResult<TData>> => {
      return request<TData, TBody>({ ...options, url, method: 'POST', body })
    },
    [request]
  )

  const patch = useCallback(
    <TData, TBody = unknown>(
      url: string,
      body?: TBody,
      options?: Omit<ApiRequestConfig<TBody>, 'url' | 'method' | 'body'>
    ): Promise<ApiResult<TData>> => {
      return request<TData, TBody>({ ...options, url, method: 'PATCH', body })
    },
    [request]
  )

  const del = useCallback(
    <TData = void>(
      url: string,
      options?: Omit<ApiRequestConfig, 'url' | 'method' | 'body'>
    ): Promise<ApiResult<TData>> => {
      return request<TData>({ ...options, url, method: 'DELETE' })
    },
    [request]
  )

  return {
    loading,
    error,
    get,
    post,
    patch,
    del,
    request,
    clearError,
    setLoading,
  }
}
