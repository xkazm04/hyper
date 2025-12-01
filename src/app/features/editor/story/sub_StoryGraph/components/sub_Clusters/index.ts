/**
 * Smart Node Grouping & Collapsible Cluster UI
 *
 * This module provides components for grouping story nodes by depth level
 * into collapsible clusters, enhancing visual organization for complex stories.
 *
 * Features:
 * - Automatic grouping by story depth (chapters/acts)
 * - Collapsible clusters with smooth animations
 * - SVG overlay rendering behind React Flow nodes
 * - Keyboard shortcuts (Alt+E expand, Alt+C collapse, Alt+G toggle)
 * - Theme-aware styling (light and Halloween modes)
 * - LocalStorage persistence of collapsed state
 */

export { default as ClusterFrame } from '../ClusterFrame'
export { default as ClusterOverlay } from '../ClusterOverlay'
export { default as ClusterControls } from '../ClusterControls'
export * from '../../lib/clusterUtils'
export { useClusterState } from '../../hooks/useClusterState'
