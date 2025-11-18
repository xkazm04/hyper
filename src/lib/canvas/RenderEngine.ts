import { Card, Element } from '@/lib/types'

/**
 * Configuration for the rendering engine
 */
export interface RenderEngineConfig {
  width: number
  height: number
  backgroundColor?: string
  interactive?: boolean
  antialias?: boolean
}

/**
 * Performance metrics for rendering
 */
export interface RenderMetrics {
  fps: number
  drawCalls: number
  elementsRendered: number
  renderTime: number // in milliseconds
  memoryUsage?: number // in MB
  engineType: 'dom' | 'canvas' | 'webgl'
}

/**
 * Abstract base class for render engines
 */
export abstract class RenderEngine {
  protected config: RenderEngineConfig
  protected card: Card | null = null
  protected elements: Element[] = []
  protected container: HTMLElement | null = null
  protected metrics: RenderMetrics = {
    fps: 0,
    drawCalls: 0,
    elementsRendered: 0,
    renderTime: 0,
    engineType: 'dom',
  }

  constructor(config: RenderEngineConfig) {
    this.config = config
  }

  /**
   * Initialize the render engine with a container
   */
  abstract initialize(container: HTMLElement): Promise<void>

  /**
   * Set the card to render
   */
  setCard(card: Card): void {
    this.card = card
  }

  /**
   * Set the elements to render
   */
  setElements(elements: Element[]): void {
    this.elements = elements
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<RenderEngineConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Render the current card and elements
   */
  abstract render(): void

  /**
   * Clean up resources
   */
  abstract destroy(): void

  /**
   * Get current performance metrics
   */
  getMetrics(): RenderMetrics {
    return { ...this.metrics }
  }

  /**
   * Resize the rendering surface
   */
  abstract resize(width: number, height: number): void

  /**
   * Get the engine type
   */
  abstract getType(): 'dom' | 'canvas' | 'webgl'

  /**
   * Register event handler for element clicks
   */
  abstract onElementClick(handler: (element: Element, event: any) => void): void

  /**
   * Register event handler for element selection (editor mode)
   */
  abstract onElementSelect(handler: (elementId: string | null) => void): void

  /**
   * Highlight a specific element (for editor mode)
   */
  abstract highlightElement(elementId: string | null): void
}

/**
 * Factory function to create the appropriate render engine
 */
export function createRenderEngine(
  type: 'dom' | 'canvas' | 'webgl',
  config: RenderEngineConfig
): RenderEngine {
  // Dynamic imports to avoid loading PixiJS when not needed
  switch (type) {
    case 'dom': {
      const { DOMRenderEngine } = require('./DOMRenderEngine')
      return new DOMRenderEngine(config)
    }
    case 'canvas': {
      const { PixiRenderEngine } = require('./PixiRenderEngine')
      return new PixiRenderEngine(config, false)
    }
    case 'webgl': {
      const { PixiRenderEngine } = require('./PixiRenderEngine')
      return new PixiRenderEngine(config, true)
    }
    default:
      throw new Error(`Unknown render engine type: ${type}`)
  }
}
