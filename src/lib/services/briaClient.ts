/**
 * Bria AI Client
 *
 * Client for Bria AI v2 image editing API
 * https://docs.bria.ai/image-editing/v2-endpoints
 */

const BRIA_API_BASE = 'https://engine.prod.bria-api.com/v1'

export interface BriaResponse {
  result_url: string
  seed?: number
}

export interface BriaError {
  error: string
  message?: string
}

/**
 * Check if Bria API is available (API key is configured)
 */
export function isBriaAvailable(): boolean {
  return !!process.env.BRIA_API_KEY
}

/**
 * Get the Bria API key
 */
function getApiKey(): string {
  const apiKey = process.env.BRIA_API_KEY
  if (!apiKey) {
    throw new Error('BRIA_API_KEY is not configured')
  }
  return apiKey
}

/**
 * Convert image URL to base64 data URL
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  // If already a data URL, return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }

  // Fetch the image and convert to base64
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')

  // Determine content type
  const contentType = response.headers.get('content-type') || 'image/png'

  return `data:${contentType};base64,${base64}`
}

/**
 * Make a request to Bria API
 */
async function briaRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey()

  const response = await fetch(`${BRIA_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_token': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as BriaError).message ||
      (errorData as BriaError).error ||
      `Bria API error: ${response.status}`
    )
  }

  return response.json()
}

/**
 * Blur background of an image
 * https://docs.bria.ai/image-editing/v2-endpoints/blur-bg
 */
export async function blurBackground(imageUrl: string): Promise<BriaResponse> {
  const base64Image = await imageUrlToBase64(imageUrl)

  // Extract just the base64 data (without the data URL prefix)
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  return briaRequest<BriaResponse>('/background/blur', {
    file: base64Data,
    blur_level: 'medium', // low, medium, high
  })
}

/**
 * Enhance image resolution (2x upscale with detail enhancement)
 * https://docs.bria.ai/image-editing/v2-endpoints/enhance
 */
export async function enhanceImage(imageUrl: string): Promise<BriaResponse> {
  const base64Image = await imageUrlToBase64(imageUrl)
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  return briaRequest<BriaResponse>('/image/enhance', {
    file: base64Data,
  })
}

/**
 * Expand/zoom out image
 * https://docs.bria.ai/image-editing/v2-endpoints/image-expansion
 */
export async function expandImage(
  imageUrl: string,
  options?: {
    expandUp?: number
    expandDown?: number
    expandLeft?: number
    expandRight?: number
  }
): Promise<BriaResponse> {
  const base64Image = await imageUrlToBase64(imageUrl)
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  // Default: expand equally on all sides (20% each direction)
  const {
    expandUp = 0.2,
    expandDown = 0.2,
    expandLeft = 0.2,
    expandRight = 0.2,
  } = options || {}

  return briaRequest<BriaResponse>('/image/expand', {
    file: base64Data,
    expand_up: expandUp,
    expand_down: expandDown,
    expand_left: expandLeft,
    expand_right: expandRight,
  })
}

export type BriaAction = 'blur' | 'enhance' | 'expand'

/**
 * Process image with specified action
 */
export async function processImage(
  imageUrl: string,
  action: BriaAction
): Promise<BriaResponse> {
  switch (action) {
    case 'blur':
      return blurBackground(imageUrl)
    case 'enhance':
      return enhanceImage(imageUrl)
    case 'expand':
      return expandImage(imageUrl)
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}
