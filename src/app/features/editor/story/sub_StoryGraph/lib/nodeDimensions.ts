/**
 * Node Dimension Calculator
 *
 * Computes dynamic node dimensions based on title length and content.
 * Uses text measurement to ensure nodes are sized appropriately without overflow.
 */

// Base dimensions
export const BASE_NODE_WIDTH = 140
export const MIN_NODE_WIDTH = 120
export const MAX_NODE_WIDTH = 220
export const NODE_PADDING_X = 16 // px left + right padding
export const NODE_PADDING_Y = 8  // px top + bottom padding

// Height calculations
export const NODE_HEADER_HEIGHT = 28  // Header with status badge
export const NODE_FOOTER_HEIGHT = 32  // Footer with completion indicators
export const TITLE_LINE_HEIGHT = 16   // Line height for title text
export const MIN_TITLE_HEIGHT = 32    // Minimum height for title area (2 lines)
export const MAX_TITLE_LINES = 3      // Maximum lines before truncation

// Font settings (match StoryNode.tsx styling)
export const TITLE_FONT_SIZE = 12     // text-xs = 12px
export const TITLE_FONT_WEIGHT = 600  // font-semibold
export const TITLE_FONT_FAMILY = 'system-ui, -apple-system, sans-serif'

// Character width estimation (average character width at 12px font)
const AVG_CHAR_WIDTH = 6.8

export interface NodeDimensions {
  width: number
  height: number
}

/**
 * Estimates text width using average character width.
 * This is a fast approximation that works well for most cases.
 */
export function estimateTextWidth(text: string, fontSize: number = TITLE_FONT_SIZE): number {
  // Scale average width by font size ratio
  const scaledCharWidth = AVG_CHAR_WIDTH * (fontSize / 12)
  return text.length * scaledCharWidth
}

/**
 * Calculates how many lines a title will need at a given width.
 */
export function calculateTitleLines(title: string, availableWidth: number): number {
  if (!title || title.trim().length === 0) {
    return 1
  }

  const textWidth = estimateTextWidth(title)
  const lines = Math.ceil(textWidth / availableWidth)
  return Math.min(lines, MAX_TITLE_LINES)
}

/**
 * Computes optimal node dimensions based on title text.
 *
 * Strategy:
 * 1. For short titles (< 15 chars): Use minimum width
 * 2. For medium titles (15-30 chars): Scale width to fit
 * 3. For long titles (> 30 chars): Use max width with word wrap
 */
export function computeNodeDimensions(title: string): NodeDimensions {
  const cleanTitle = title?.trim() || 'Untitled'
  const titleLength = cleanTitle.length

  // Calculate text width
  const textWidth = estimateTextWidth(cleanTitle)

  // Available width for text (total width minus padding)
  let nodeWidth: number

  if (titleLength <= 12) {
    // Short titles: use minimum width
    nodeWidth = MIN_NODE_WIDTH
  } else if (titleLength <= 25) {
    // Medium titles: scale width to fit on 2 lines
    // Target: text fits in 2 lines
    const targetLineWidth = textWidth / 2
    nodeWidth = Math.min(
      Math.max(targetLineWidth + NODE_PADDING_X, MIN_NODE_WIDTH),
      MAX_NODE_WIDTH
    )
  } else {
    // Long titles: allow up to max width
    // Target: text fits in 2-3 lines
    const targetLineWidth = textWidth / 2.5
    nodeWidth = Math.min(
      Math.max(targetLineWidth + NODE_PADDING_X, BASE_NODE_WIDTH),
      MAX_NODE_WIDTH
    )
  }

  // Round to nearest 10 for cleaner layout
  nodeWidth = Math.round(nodeWidth / 10) * 10

  // Calculate height based on title lines
  const availableTextWidth = nodeWidth - NODE_PADDING_X
  const titleLines = calculateTitleLines(cleanTitle, availableTextWidth)
  const titleHeight = Math.max(titleLines * TITLE_LINE_HEIGHT, MIN_TITLE_HEIGHT)

  const nodeHeight = NODE_HEADER_HEIGHT + titleHeight + NODE_FOOTER_HEIGHT + NODE_PADDING_Y

  return {
    width: nodeWidth,
    height: nodeHeight,
  }
}

/**
 * Pre-computes dimensions for multiple cards at once.
 * Returns a Map of cardId -> dimensions.
 */
export function computeBatchNodeDimensions(
  cards: Array<{ id: string; title?: string }>
): Map<string, NodeDimensions> {
  const dimensionsMap = new Map<string, NodeDimensions>()

  for (const card of cards) {
    const dimensions = computeNodeDimensions(card.title || 'Untitled')
    dimensionsMap.set(card.id, dimensions)
  }

  return dimensionsMap
}

/**
 * Gets dimension values for layout calculations.
 * Used by dagre layout to set node sizes.
 */
export function getDimensionsForLayout(
  cardId: string,
  dimensionsMap: Map<string, NodeDimensions>
): { width: number; height: number } {
  const dimensions = dimensionsMap.get(cardId)
  if (dimensions) {
    return dimensions
  }
  // Fallback to base dimensions
  return {
    width: BASE_NODE_WIDTH,
    height: NODE_HEADER_HEIGHT + MIN_TITLE_HEIGHT + NODE_FOOTER_HEIGHT + NODE_PADDING_Y,
  }
}
