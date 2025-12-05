import { StoryCard } from '@/lib/types'

// Re-export GeneratedSketch from the source to avoid type conflicts
export type { GeneratedSketch } from '../../../../sub_ContentSection/lib/sketchGeneration'

// ============================================================================
// Types
// ============================================================================

export type GenerationState = 'idle' | 'loading' | 'success' | 'error'

export interface NodeContextMenuProps {
  nodeId: string
  card: StoryCard
  position: { x: number; y: number }
  isHalloween?: boolean
  onClose: () => void
  onDelete: () => void
}
