/**
 * Render engine configuration and selection
 */

export type RenderEngineType = 'dom' | 'canvas' | 'webgl' | 'auto'

export interface RenderConfiguration {
  // Selected render engine type
  engineType: RenderEngineType

  // Automatic switching thresholds
  autoSwitchEnabled: boolean
  autoSwitchThresholds: {
    domToCanvas: number // Element count threshold to switch from DOM to Canvas
    canvasToWebGL: number // Element count threshold to switch from Canvas to WebGL
  }

  // Performance monitoring
  performanceMonitoringEnabled: boolean
  fpsThreshold: number // Minimum acceptable FPS

  // Engine-specific settings
  domSettings: {
    enableAccessibility: boolean
    enableAnimations: boolean
  }

  canvasSettings: {
    antialias: boolean
    resolution: number // Device pixel ratio multiplier
    preserveDrawingBuffer: boolean
  }

  webglSettings: {
    antialias: boolean
    resolution: number
    powerPreference: 'high-performance' | 'low-power' | 'default'
  }
}

/**
 * Default render configuration
 */
export const DEFAULT_RENDER_CONFIG: RenderConfiguration = {
  engineType: 'auto',
  autoSwitchEnabled: true,
  autoSwitchThresholds: {
    domToCanvas: 100,
    canvasToWebGL: 500,
  },
  performanceMonitoringEnabled: true,
  fpsThreshold: 30,
  domSettings: {
    enableAccessibility: true,
    enableAnimations: true,
  },
  canvasSettings: {
    antialias: true,
    resolution: 1,
    preserveDrawingBuffer: false,
  },
  webglSettings: {
    antialias: true,
    resolution: 1,
    powerPreference: 'high-performance',
  },
}

/**
 * Storage key for render configuration
 */
const RENDER_CONFIG_KEY = 'hyper_render_config'

/**
 * Load render configuration from localStorage
 */
export function loadRenderConfig(): RenderConfiguration {
  if (typeof window === 'undefined') {
    return DEFAULT_RENDER_CONFIG
  }

  try {
    const stored = localStorage.getItem(RENDER_CONFIG_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_RENDER_CONFIG, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load render config:', error)
  }

  return DEFAULT_RENDER_CONFIG
}

/**
 * Save render configuration to localStorage
 */
export function saveRenderConfig(config: RenderConfiguration): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(RENDER_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save render config:', error)
  }
}

/**
 * Determine the appropriate render engine based on element count and configuration
 */
export function selectRenderEngine(
  config: RenderConfiguration,
  elementCount: number
): 'dom' | 'canvas' | 'webgl' {
  if (config.engineType !== 'auto') {
    return config.engineType as 'dom' | 'canvas' | 'webgl'
  }

  if (!config.autoSwitchEnabled) {
    return 'dom' // Default to DOM if auto-switch is disabled
  }

  // Auto-select based on element count
  if (elementCount >= config.autoSwitchThresholds.canvasToWebGL) {
    return 'webgl'
  } else if (elementCount >= config.autoSwitchThresholds.domToCanvas) {
    return 'canvas'
  } else {
    return 'dom'
  }
}

/**
 * Check if WebGL is supported in the current browser
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (error) {
    return false
  }
}

/**
 * Get recommended render engine based on system capabilities
 */
export function getRecommendedRenderEngine(elementCount: number): {
  engine: 'dom' | 'canvas' | 'webgl'
  reason: string
} {
  const webglSupported = isWebGLSupported()

  if (elementCount < 50) {
    return {
      engine: 'dom',
      reason: 'Small element count. DOM provides best accessibility and simplicity.',
    }
  } else if (elementCount < 200) {
    return {
      engine: 'canvas',
      reason: 'Moderate element count. Canvas provides good balance of performance and compatibility.',
    }
  } else if (elementCount < 1000) {
    if (webglSupported) {
      return {
        engine: 'webgl',
        reason: 'Large element count. WebGL provides optimal performance.',
      }
    } else {
      return {
        engine: 'canvas',
        reason: 'Large element count, but WebGL not supported. Canvas is best fallback.',
      }
    }
  } else {
    if (webglSupported) {
      return {
        engine: 'webgl',
        reason: 'Very large element count. WebGL is required for acceptable performance.',
      }
    } else {
      return {
        engine: 'canvas',
        reason: 'Very large element count, but WebGL not supported. Performance may be limited.',
      }
    }
  }
}

/**
 * Render engine capability matrix
 */
export const RENDER_ENGINE_CAPABILITIES = {
  dom: {
    maxRecommendedElements: 100,
    accessibility: 'full',
    performance: 'low',
    compatibility: 'excellent',
    interactivity: 'full',
    pros: [
      'Full accessibility support',
      'Native browser events',
      'Easy to debug',
      'CSS styling support',
      'Form input support',
    ],
    cons: [
      'Poor performance with many elements',
      'Layout thrashing',
      'High CPU usage for animations',
    ],
  },
  canvas: {
    maxRecommendedElements: 500,
    accessibility: 'limited',
    performance: 'good',
    compatibility: 'excellent',
    interactivity: 'custom',
    pros: [
      'Good performance up to 500 elements',
      'Lower CPU usage',
      'Smooth animations',
      'Consistent cross-browser rendering',
    ],
    cons: [
      'Limited accessibility',
      'Custom event handling required',
      'No native form inputs',
      'Pixel-based (scaling issues)',
    ],
  },
  webgl: {
    maxRecommendedElements: 5000,
    accessibility: 'limited',
    performance: 'excellent',
    compatibility: 'good',
    interactivity: 'custom',
    pros: [
      'Excellent performance with 1000+ elements',
      'GPU-accelerated rendering',
      'Very smooth animations',
      'Handles complex scenes',
    ],
    cons: [
      'Limited accessibility',
      'Requires WebGL support',
      'Higher GPU usage',
      'More complex implementation',
      'No native form inputs',
    ],
  },
}
