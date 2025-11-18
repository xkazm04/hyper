import OpenAI from 'openai'

// Lazy initialization of OpenAI client (server-side only)
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    // Check if we're on the server
    if (typeof window !== 'undefined') {
      throw new Error('OpenAI client should only be used on the server side')
    }
    
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
  }
  return openaiInstance
}

export interface EmbeddingResult {
  embedding: number[]
  tokens: number
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 * This is more cost-effective than ada-002 with similar performance
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536, // Match the vector dimension in our database
    })

    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens,
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts in a batch
 * More efficient for processing multiple items at once
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: 1536,
    })

    return response.data.map((item) => ({
      embedding: item.embedding,
      tokens: response.usage.total_tokens / texts.length, // Approximate tokens per text
    }))
  } catch (error) {
    console.error('Error generating embeddings batch:', error)
    throw new Error('Failed to generate embeddings batch')
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    magnitudeA += vecA[i] * vecA[i]
    magnitudeB += vecB[i] * vecB[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Prepare text content from a stack for embedding generation
 * Combines name, description, and tags into a meaningful representation
 */
export function prepareStackTextForEmbedding(stack: {
  name: string
  description: string | null
  tags?: string[]
}): string {
  const parts = [
    `Stack: ${stack.name}`,
  ]

  if (stack.description) {
    parts.push(`Description: ${stack.description}`)
  }

  if (stack.tags && stack.tags.length > 0) {
    parts.push(`Tags: ${stack.tags.join(', ')}`)
  }

  return parts.join('\n')
}

/**
 * Prepare text content from a card for embedding generation
 */
export function prepareCardTextForEmbedding(card: {
  name: string
  script?: string | null
}): string {
  const parts = [
    `Card: ${card.name}`,
  ]

  if (card.script) {
    // Limit script length to avoid token limits
    const scriptPreview = card.script.slice(0, 500)
    parts.push(`Script: ${scriptPreview}`)
  }

  return parts.join('\n')
}
