import { RenderEngine, RenderEngineConfig, RenderMetrics } from './RenderEngine'
import { Element } from '@/lib/types'

/**
 * DOM-based render engine (current implementation)
 * Uses React components and standard DOM elements
 */
export class DOMRenderEngine extends RenderEngine {
  private clickHandler: ((element: Element, event: any) => void) | null = null
  private selectHandler: ((elementId: string | null) => void) | null = null
  private selectedElementId: string | null = null
  private frameStartTime: number = 0
  private frameCount: number = 0
  private lastFpsUpdate: number = 0

  constructor(config: RenderEngineConfig) {
    super(config)
    this.metrics.engineType = 'dom'
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    // DOM rendering is handled by React components
    // No additional initialization needed
  }

  render(): void {
    if (!this.container) {
      console.warn('DOMRenderEngine: Container not initialized')
      return
    }

    this.frameStartTime = performance.now()

    // DOM rendering is handled by React's virtual DOM
    // This method is called to track metrics
    this.metrics.elementsRendered = this.elements.filter(
      el => (el.properties as any).visible !== false
    ).length
    this.metrics.drawCalls = this.metrics.elementsRendered

    const renderTime = performance.now() - this.frameStartTime
    this.metrics.renderTime = renderTime

    // Calculate FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastFpsUpdate >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate))
      this.frameCount = 0
      this.lastFpsUpdate = now
    }

    // Estimate memory usage (rough approximation)
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / (1024 * 1024)
    }
  }

  destroy(): void {
    this.container = null
    this.clickHandler = null
    this.selectHandler = null
    this.selectedElementId = null
  }

  resize(width: number, height: number): void {
    this.config.width = width
    this.config.height = height
    // DOM elements resize automatically with CSS
  }

  getType(): 'dom' | 'canvas' | 'webgl' {
    return 'dom'
  }

  onElementClick(handler: (element: Element, event: any) => void): void {
    this.clickHandler = handler
  }

  onElementSelect(handler: (elementId: string | null) => void): void {
    this.selectHandler = handler
  }

  highlightElement(elementId: string | null): void {
    this.selectedElementId = elementId
  }

  /**
   * Trigger element click handler (called by React components)
   */
  triggerElementClick(element: Element, event: any): void {
    if (this.clickHandler) {
      this.clickHandler(element, event)
    }
  }

  /**
   * Trigger element select handler (called by React components)
   */
  triggerElementSelect(elementId: string | null): void {
    if (this.selectHandler) {
      this.selectHandler(elementId)
    }
  }

  /**
   * Get the currently selected element ID
   */
  getSelectedElementId(): string | null {
    return this.selectedElementId
  }
}
