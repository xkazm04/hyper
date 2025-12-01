/**
 * Cluster Utilities
 *
 * Provides logic for grouping nodes into clusters based on depth levels
 * in the story graph. Clusters allow users to collapse/expand groups
 * of related nodes for better visual organization.
 */

import { Node } from 'reactflow'
import { StoryNodeData } from '../components/StoryNode'

export interface ClusterGroup {
  id: string
  label: string
  depth: number
  nodeIds: string[]
  bounds: ClusterBounds
  isCollapsed: boolean
}

export interface ClusterBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

const CLUSTER_PADDING = 32 // Padding around nodes within cluster
const MIN_CLUSTER_SIZE = 2 // Minimum nodes to form a cluster

/**
 * Generates a human-readable label for a depth level
 */
function getDepthLabel(depth: number): string {
  const labels: Record<number, string> = {
    0: 'Opening',
    1: 'Act I',
    2: 'Rising Action',
    3: 'Midpoint',
    4: 'Falling Action',
    5: 'Climax',
    6: 'Resolution',
  }
  return labels[depth] ?? `Chapter ${depth + 1}`
}

/**
 * Calculates the bounding box for a set of nodes
 */
export function calculateClusterBounds(
  nodes: Node<StoryNodeData>[],
  padding: number = CLUSTER_PADDING
): ClusterBounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(node => {
    const nodeWidth = node.data.nodeWidth ?? 140
    const nodeHeight = node.data.nodeHeight ?? 95

    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + nodeWidth)
    maxY = Math.max(maxY, node.position.y + nodeHeight)
  })

  // Apply padding
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

/**
 * Groups nodes by their depth level and creates cluster groups
 */
export function createDepthClusters(
  nodes: Node<StoryNodeData>[],
  collapsedClusters: Set<string>
): ClusterGroup[] {
  // Group nodes by depth
  const nodesByDepth = new Map<number, Node<StoryNodeData>[]>()

  nodes.forEach(node => {
    const depth = node.data.depth ?? -1
    if (depth < 0) return // Skip orphaned nodes

    const existing = nodesByDepth.get(depth) || []
    existing.push(node)
    nodesByDepth.set(depth, existing)
  })

  // Create cluster groups for depths with enough nodes
  const clusters: ClusterGroup[] = []

  nodesByDepth.forEach((depthNodes, depth) => {
    // Only create clusters for groups with minimum size
    if (depthNodes.length < MIN_CLUSTER_SIZE) return

    const clusterId = `cluster-depth-${depth}`
    const bounds = calculateClusterBounds(depthNodes)

    clusters.push({
      id: clusterId,
      label: getDepthLabel(depth),
      depth,
      nodeIds: depthNodes.map(n => n.id),
      bounds,
      isCollapsed: collapsedClusters.has(clusterId),
    })
  })

  // Sort clusters by depth
  return clusters.sort((a, b) => a.depth - b.depth)
}

/**
 * Creates a collapsed cluster representation (single icon node)
 */
export function getCollapsedClusterPosition(cluster: ClusterGroup): { x: number; y: number } {
  return {
    x: cluster.bounds.centerX - 30, // Half of collapsed cluster width
    y: cluster.bounds.centerY - 30, // Half of collapsed cluster height
  }
}

/**
 * Checks if a point is within a cluster's bounds
 */
export function isPointInCluster(
  x: number,
  y: number,
  cluster: ClusterGroup
): boolean {
  return (
    x >= cluster.bounds.minX &&
    x <= cluster.bounds.maxX &&
    y >= cluster.bounds.minY &&
    y <= cluster.bounds.maxY
  )
}

/**
 * Gets cluster color based on depth for visual differentiation
 */
export function getClusterColor(depth: number, isHalloween: boolean): string {
  const lightColors = [
    'rgba(59, 130, 246, 0.1)',   // Blue - Opening
    'rgba(16, 185, 129, 0.1)',   // Green - Act I
    'rgba(245, 158, 11, 0.1)',   // Amber - Rising Action
    'rgba(239, 68, 68, 0.1)',    // Red - Midpoint
    'rgba(168, 85, 247, 0.1)',   // Purple - Falling Action
    'rgba(236, 72, 153, 0.1)',   // Pink - Climax
    'rgba(99, 102, 241, 0.1)',   // Indigo - Resolution
  ]

  const halloweenColors = [
    'rgba(249, 115, 22, 0.15)',  // Orange
    'rgba(139, 92, 246, 0.15)',  // Purple
    'rgba(236, 72, 153, 0.12)', // Pink
    'rgba(245, 158, 11, 0.12)', // Amber
    'rgba(168, 85, 247, 0.12)', // Violet
    'rgba(220, 38, 38, 0.12)',  // Red
    'rgba(192, 38, 211, 0.12)', // Fuchsia
  ]

  const colors = isHalloween ? halloweenColors : lightColors
  return colors[depth % colors.length]
}

/**
 * Gets cluster border color based on depth
 */
export function getClusterBorderColor(depth: number, isHalloween: boolean): string {
  const lightBorders = [
    'rgba(59, 130, 246, 0.3)',   // Blue
    'rgba(16, 185, 129, 0.3)',   // Green
    'rgba(245, 158, 11, 0.3)',   // Amber
    'rgba(239, 68, 68, 0.3)',    // Red
    'rgba(168, 85, 247, 0.3)',   // Purple
    'rgba(236, 72, 153, 0.3)',   // Pink
    'rgba(99, 102, 241, 0.3)',   // Indigo
  ]

  const halloweenBorders = [
    'rgba(249, 115, 22, 0.4)',  // Orange
    'rgba(139, 92, 246, 0.4)',  // Purple
    'rgba(236, 72, 153, 0.35)', // Pink
    'rgba(245, 158, 11, 0.35)', // Amber
    'rgba(168, 85, 247, 0.35)', // Violet
    'rgba(220, 38, 38, 0.35)',  // Red
    'rgba(192, 38, 211, 0.35)', // Fuchsia
  ]

  const borders = isHalloween ? halloweenBorders : lightBorders
  return borders[depth % borders.length]
}
