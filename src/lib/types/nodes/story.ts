// Story-related node types - Card integration with node graphs

import type { NodeGraph } from './base'

// Extended Card type with node graph support
export interface CardWithNodeGraph {
  script?: string | null
  nodeGraph?: NodeGraph | null
  scriptMode?: 'code' | 'nodes'
}
