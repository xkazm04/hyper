import { StoryCard } from '@/lib/types'

export interface OutlineNodeData {
  id: string
  card: StoryCard
  children: OutlineNodeData[]
  depth: number
  isExpanded: boolean
}

export interface DragItem {
  id: string
  index: number
  type: string
}
