/**
 * Bria AI Tailored Generation Service
 *
 * Handles:
 * - Project/Dataset/Model lifecycle management
 * - Character model training pipeline
 * - Scene reimagine generation
 * - Random sketch generation
 */

const BRIA_API_BASE = 'https://engine.prod.bria-api.com/v1'

export interface BriaProject {
  id: string
  name: string
  ip_type: string
  medium: string
  created_at: string
}

export interface BriaDataset {
  id: string
  project_id: string
  name: string
  status: 'draft' | 'completed'
  caption_prefix: string | null
  created_at: string
}

export interface BriaModel {
  id: string
  dataset_id: string
  name: string
  status: 'created' | 'training' | 'completed' | 'failed'
  training_version: 'max' | 'light'
  generation_prefix?: string
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface BriaGenerationResult {
  result_url: string
  seed: number
  prompt_used?: string
}

export interface BriaGenerationOptions {
  structureStrength?: number
  numResults?: number
  seed?: number
  aspectRatio?: string
}

export class BriaService {
  private apiToken: string

  constructor(apiToken?: string) {
    // Use BRIA_API_KEY for consistency with existing briaClient.ts
    this.apiToken = apiToken || process.env.BRIA_API_KEY || ''
  }

  /**
   * Check if the Bria API is available
   */
  isAvailable(): boolean {
    return !!this.apiToken
  }

  /**
   * Make authenticated request to Bria API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${BRIA_API_BASE}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        'api_token': this.apiToken,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    console.log(`[Bria] ${method} ${endpoint}`, body ? JSON.stringify(body).slice(0, 200) : '')

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorData.detail || errorText
      } catch {
        errorMessage = errorText || `${response.status} ${response.statusText}`
      }
      console.error(`[Bria] API Error: ${response.status} - ${errorMessage}`)
      throw new Error(`Bria API error: ${response.status} - ${errorMessage}`)
    }

    return response.json()
  }

  // ==================== Training Pipeline ====================

  /**
   * Create a new project for character training
   * API Reference: https://docs.bria.ai/tailored-generation/training-endpoints/create-project
   */
  async createProject(
    name: string,
    ipName: string,
    medium: 'illustration' | 'photography' = 'illustration'
  ): Promise<string> {
    const result = await this.request<BriaProject>('/tailored-gen/projects', 'POST', {
      project_name: name,
      ip_type: 'defined_character',
      ip_name: ipName,
      ip_medium: medium,
    })
    return result.id
  }

  /**
   * Create a dataset within a project
   * API Reference: https://docs.bria.ai/tailored-generation/training-endpoints/create-dataset
   */
  async createDataset(projectId: string, name: string): Promise<string> {
    const result = await this.request<BriaDataset>('/tailored-gen/datasets', 'POST', {
      project_id: projectId,
      name: name,
    })
    return result.id
  }

  /**
   * Generate a caption prefix from sample images
   * Uses 1-6 images to generate a descriptive prefix for the character
   */
  async generatePrefix(imageBase64Array: string[]): Promise<string> {
    const result = await this.request<{ prefix: string }>('/tailored-gen/generate_prefix', 'POST', {
      images: imageBase64Array.slice(0, 6), // Max 6 images
    })
    return result.prefix
  }

  /**
   * Update dataset with caption prefix
   */
  async updateDatasetPrefix(datasetId: string, prefix: string): Promise<void> {
    await this.request(`/tailored-gen/datasets/${datasetId}`, 'PUT', {
      caption_prefix: prefix,
    })
  }

  /**
   * Upload an image to the dataset
   */
  async uploadImageToDataset(datasetId: string, imageBase64: string): Promise<void> {
    await this.request(`/tailored-gen/datasets/${datasetId}/images`, 'POST', {
      file: imageBase64,
      increase_resolution: true, // Auto-upscale if needed
    })
  }

  /**
   * Mark dataset as completed (ready for training)
   */
  async completeDataset(datasetId: string): Promise<void> {
    await this.request(`/tailored-gen/datasets/${datasetId}`, 'PUT', {
      status: 'completed',
    })
  }

  /**
   * Create a model configuration
   * API Reference: https://docs.bria.ai/tailored-generation/endpoints/create-model
   */
  async createModel(
    datasetId: string,
    name: string,
    version: 'max' | 'light' = 'max'
  ): Promise<string> {
    const result = await this.request<BriaModel>('/tailored-gen/models', 'POST', {
      dataset_id: datasetId,
      model_name: name,
      training_mode: 'fully_automated',
      training_version: version,
    })
    return result.id
  }

  /**
   * Start model training (async, takes 1-3 hours)
   */
  async startTraining(modelId: string): Promise<void> {
    await this.request(`/tailored-gen/models/${modelId}/start_training`, 'POST')
  }

  /**
   * Get model status
   */
  async getModelStatus(modelId: string): Promise<BriaModel> {
    return this.request<BriaModel>(`/tailored-gen/models/${modelId}`)
  }

  // ==================== Generation ====================

  /**
   * Reimagine a scene with the trained character
   * Uses scene reference image and preserves its structure
   */
  async reimagineWithScene(
    modelId: string,
    sceneImageBase64: string,
    prompt: string,
    options: BriaGenerationOptions = {}
  ): Promise<BriaGenerationResult> {
    const {
      structureStrength = 0.6,
      numResults = 1,
      seed,
    } = options

    const body: Record<string, unknown> = {
      file: sceneImageBase64,
      prompt,
      structure_strength: structureStrength,
      num_results: numResults,
      sync: true,
    }

    if (seed !== undefined) {
      body.seed = seed
    }

    return this.request<BriaGenerationResult>(
      `/reimagine/tailored/${modelId}`,
      'POST',
      body
    )
  }

  /**
   * Generate character image from text prompt only
   * Great for generating random poses/expressions
   */
  async textToImage(
    modelId: string,
    prompt: string,
    options: BriaGenerationOptions = {}
  ): Promise<BriaGenerationResult> {
    const {
      aspectRatio = '1:1',
      numResults = 1,
      seed,
    } = options

    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      num_results: numResults,
      sync: true,
    }

    if (seed !== undefined) {
      body.seed = seed
    }

    return this.request<BriaGenerationResult>(
      `/text-to-image/tailored/${modelId}`,
      'POST',
      body
    )
  }

  /**
   * Generate multiple random sketches with varied poses
   * Returns array of images with different expressions/poses
   */
  async generateRandomSketches(
    modelId: string,
    characterPrefix: string,
    count: number = 8
  ): Promise<Array<{ url: string; seed: number; prompt: string }>> {
    const posePrompts = [
      'standing heroically, confident powerful pose, dramatic lighting',
      'sitting casually, relaxed expression, warm ambient light',
      'dynamic action pose, mid-movement, energetic',
      'mysterious profile view, dramatic shadows, atmospheric',
      'walking forward, determined expression, natural lighting',
      'battle ready stance, intense focus, dramatic mood',
      'peaceful moment, soft gentle smile, soft lighting',
      'close-up portrait, intense gaze, cinematic lighting',
      'full body shot, neutral standing pose, studio lighting',
      'three-quarter view, thoughtful expression, soft shadows',
    ]

    const selectedPoses = posePrompts.slice(0, count)
    const results: Array<{ url: string; seed: number; prompt: string }> = []

    for (const posePrompt of selectedPoses) {
      try {
        const fullPrompt = `${characterPrefix} ${posePrompt}`
        const result = await this.textToImage(modelId, fullPrompt)
        results.push({
          url: result.result_url,
          seed: result.seed,
          prompt: fullPrompt,
        })
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Failed to generate sketch:', error)
        // Continue with other sketches even if one fails
      }
    }

    return results
  }
}

// ==================== Training Orchestrator ====================

/**
 * Orchestrates the complete training pipeline
 * Converts image URLs to base64 and manages the entire workflow
 */
export class BriaTrainingOrchestrator {
  private bria: BriaService

  constructor(briaService?: BriaService) {
    this.bria = briaService || new BriaService()
  }

  /**
   * Convert image URL to base64
   */
  private async urlToBase64(url: string): Promise<string> {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return base64
  }

  /**
   * Run the complete training pipeline
   * Returns immediately after starting training (async process)
   */
  async startTraining(
    characterId: string,
    characterName: string,
    imageUrls: string[]
  ): Promise<{
    projectId: string
    datasetId: string
    modelId: string
    captionPrefix: string
  }> {
    if (imageUrls.length < 5) {
      throw new Error('At least 5 images are required for training')
    }

    // Step 1: Convert images to base64
    console.log(`[Bria] Converting ${imageUrls.length} images to base64...`)
    const imageBase64Array = await Promise.all(
      imageUrls.map(url => this.urlToBase64(url))
    )

    // Step 2: Create project
    const projectName = `Character_${characterName}_${characterId.slice(0, 8)}`
    console.log(`[Bria] Creating project: ${projectName}`)
    const projectId = await this.bria.createProject(projectName, characterName)

    // Step 3: Create dataset
    const datasetName = `${characterName}_training`
    console.log(`[Bria] Creating dataset: ${datasetName}`)
    const datasetId = await this.bria.createDataset(projectId, datasetName)

    // Step 4: Generate caption prefix from first 6 images
    console.log('[Bria] Generating caption prefix...')
    const captionPrefix = await this.bria.generatePrefix(imageBase64Array.slice(0, 6))

    // Step 5: Update dataset with prefix
    console.log('[Bria] Updating dataset with prefix...')
    await this.bria.updateDatasetPrefix(datasetId, captionPrefix)

    // Step 6: Upload all images
    console.log(`[Bria] Uploading ${imageBase64Array.length} images...`)
    for (let i = 0; i < imageBase64Array.length; i++) {
      await this.bria.uploadImageToDataset(datasetId, imageBase64Array[i])
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Step 7: Complete dataset
    console.log('[Bria] Marking dataset as completed...')
    await this.bria.completeDataset(datasetId)

    // Step 8: Create model
    const modelName = `${characterName}_model`
    console.log(`[Bria] Creating model: ${modelName}`)
    const modelId = await this.bria.createModel(datasetId, modelName, 'max')

    // Step 9: Start training (async, 1-3 hours)
    console.log('[Bria] Starting training...')
    await this.bria.startTraining(modelId)

    console.log('[Bria] Training started successfully!')
    return {
      projectId,
      datasetId,
      modelId,
      captionPrefix,
    }
  }
}

// Singleton instance for convenience
let briaServiceInstance: BriaService | null = null

export function getBriaService(): BriaService {
  if (!briaServiceInstance) {
    briaServiceInstance = new BriaService()
  }
  return briaServiceInstance
}
