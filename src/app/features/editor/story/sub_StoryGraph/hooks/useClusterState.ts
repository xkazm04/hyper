/**
 * useClusterState - Hook for managing cluster collapse/expand state
 *
 * Features:
 * - Persists collapsed clusters to localStorage
 * - Provides toggle/expand/collapse functions
 * - Syncs with story stack ID for per-story preferences
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Node } from 'reactflow'
import { StoryNodeData } from '../components/StoryNode'
import { createDepthClusters, ClusterGroup } from '../lib/clusterUtils'

const STORAGE_KEY_PREFIX = 'hyper_collapsed_clusters_'

interface UseClusterStateOptions {
  stackId: string | null
  nodes: Node<StoryNodeData>[]
}

interface UseClusterStateReturn {
  clusters: ClusterGroup[]
  collapsedClusters: Set<string>
  toggleCluster: (clusterId: string) => void
  expandCluster: (clusterId: string) => void
  collapseCluster: (clusterId: string) => void
  expandAll: () => void
  collapseAll: () => void
  isClusterCollapsed: (clusterId: string) => boolean
  getClusterByNodeId: (nodeId: string) => ClusterGroup | null
}

export function useClusterState({
  stackId,
  nodes,
}: UseClusterStateOptions): UseClusterStateReturn {
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set())

  // Load collapsed state from localStorage
  useEffect(() => {
    if (!stackId) return

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${stackId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setCollapsedClusters(new Set(parsed))
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [stackId])

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (!stackId) return

    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${stackId}`,
        JSON.stringify(Array.from(collapsedClusters))
      )
    } catch {
      // Ignore localStorage errors
    }
  }, [collapsedClusters, stackId])

  // Compute clusters from nodes
  const clusters = useMemo(() => {
    return createDepthClusters(nodes, collapsedClusters)
  }, [nodes, collapsedClusters])

  // Toggle a cluster's collapsed state
  const toggleCluster = useCallback((clusterId: string) => {
    setCollapsedClusters(prev => {
      const next = new Set(prev)
      if (next.has(clusterId)) {
        next.delete(clusterId)
      } else {
        next.add(clusterId)
      }
      return next
    })
  }, [])

  // Expand a specific cluster
  const expandCluster = useCallback((clusterId: string) => {
    setCollapsedClusters(prev => {
      const next = new Set(prev)
      next.delete(clusterId)
      return next
    })
  }, [])

  // Collapse a specific cluster
  const collapseCluster = useCallback((clusterId: string) => {
    setCollapsedClusters(prev => {
      const next = new Set(prev)
      next.add(clusterId)
      return next
    })
  }, [])

  // Expand all clusters
  const expandAll = useCallback(() => {
    setCollapsedClusters(new Set())
  }, [])

  // Collapse all clusters
  const collapseAll = useCallback(() => {
    const allClusterIds = clusters.map(c => c.id)
    setCollapsedClusters(new Set(allClusterIds))
  }, [clusters])

  // Check if a cluster is collapsed
  const isClusterCollapsed = useCallback(
    (clusterId: string) => collapsedClusters.has(clusterId),
    [collapsedClusters]
  )

  // Get cluster containing a specific node
  const getClusterByNodeId = useCallback(
    (nodeId: string): ClusterGroup | null => {
      return clusters.find(c => c.nodeIds.includes(nodeId)) ?? null
    },
    [clusters]
  )

  return {
    clusters,
    collapsedClusters,
    toggleCluster,
    expandCluster,
    collapseCluster,
    expandAll,
    collapseAll,
    isClusterCollapsed,
    getClusterByNodeId,
  }
}
