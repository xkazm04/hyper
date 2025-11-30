'use client'

import { useMemo, useCallback } from 'react'
import { useThemeLayer } from '../ThemeLayerContext'
import type { NodeSkinType, EdgeSkinType, NodeSkin, EdgeSkin } from './types'

interface NodeSkinResult {
  className: string
  styles?: React.CSSProperties
  animationClass?: string
  icon?: React.ReactNode
}

interface EdgeSkinResult {
  strokeColor: string
  strokeWidth: number
  animated: boolean
  dashArray?: string
  style?: React.CSSProperties
}

/**
 * Hook to get Halloween node skins based on node state
 *
 * Returns themed class names, styles, and animations for nodes
 */
export function useHalloweenNodeSkin() {
  const themeLayer = useThemeLayer()

  const getNodeSkin = useCallback((type: NodeSkinType): NodeSkinResult | null => {
    if (themeLayer.theme !== 'halloween' || !themeLayer.effectsEnabled) {
      return null
    }

    const skin = themeLayer.getNodeSkin(type)
    if (!skin) return null

    return {
      className: skin.className,
      styles: skin.styles,
      animationClass: skin.animationClass,
      icon: skin.icon,
    }
  }, [themeLayer])

  /**
   * Get combined skin for a node based on multiple states
   */
  const getCombinedNodeSkin = useCallback(({
    isFirst,
    isDeadEnd,
    isOrphaned,
    isComplete,
    isSelected,
  }: {
    isFirst?: boolean
    isDeadEnd?: boolean
    isOrphaned?: boolean
    isComplete?: boolean
    isSelected?: boolean
  }): NodeSkinResult | null => {
    if (themeLayer.theme !== 'halloween' || !themeLayer.effectsEnabled) {
      return null
    }

    // Priority order for skin selection
    if (isSelected) {
      return getNodeSkin('selected')
    }
    if (isFirst) {
      return getNodeSkin('first')
    }
    if (isDeadEnd) {
      return getNodeSkin('dead-end')
    }
    if (isOrphaned) {
      return getNodeSkin('orphaned')
    }
    if (isComplete) {
      return getNodeSkin('complete')
    }

    return getNodeSkin('default')
  }, [themeLayer.theme, themeLayer.effectsEnabled, getNodeSkin])

  return {
    getNodeSkin,
    getCombinedNodeSkin,
    isHalloweenActive: themeLayer.theme === 'halloween' && themeLayer.effectsEnabled,
  }
}

/**
 * Hook to get Halloween edge skins
 *
 * Returns themed styles for React Flow edges
 */
export function useHalloweenEdgeSkin() {
  const themeLayer = useThemeLayer()

  const getEdgeSkin = useCallback((type: EdgeSkinType): EdgeSkinResult | null => {
    if (themeLayer.theme !== 'halloween' || !themeLayer.effectsEnabled) {
      return null
    }

    const skin = themeLayer.getEdgeSkin(type)
    if (!skin) return null

    const glowStyle: React.CSSProperties = skin.glowColor ? {
      filter: `drop-shadow(0 0 ${(skin.glowIntensity ?? 0.3) * 8}px ${skin.glowColor})`,
    } : {}

    return {
      strokeColor: skin.strokeColor,
      strokeWidth: skin.strokeWidth,
      animated: skin.animated,
      dashArray: skin.dashArray,
      style: glowStyle,
    }
  }, [themeLayer])

  /**
   * Get edge skin based on state
   */
  const getEdgeSkinForState = useCallback(({
    isHighlighted,
    isOnPath,
  }: {
    isHighlighted?: boolean
    isOnPath?: boolean
  }): EdgeSkinResult | null => {
    if (themeLayer.theme !== 'halloween' || !themeLayer.effectsEnabled) {
      return null
    }

    if (isHighlighted) {
      return getEdgeSkin('highlighted')
    }
    if (isOnPath) {
      return getEdgeSkin('path')
    }

    return getEdgeSkin('default')
  }, [themeLayer.theme, themeLayer.effectsEnabled, getEdgeSkin])

  return {
    getEdgeSkin,
    getEdgeSkinForState,
    isHalloweenActive: themeLayer.theme === 'halloween' && themeLayer.effectsEnabled,
  }
}

/**
 * Hook to get Halloween sound effects
 */
export function useHalloweenSounds() {
  const themeLayer = useThemeLayer()

  const playNodeClick = useCallback(() => {
    themeLayer.playSound('node-click')
  }, [themeLayer])

  const playNodeDrop = useCallback(() => {
    themeLayer.playSound('node-drop')
  }, [themeLayer])

  const playNodeCreate = useCallback(() => {
    themeLayer.playSound('node-create')
  }, [themeLayer])

  const playNodeDelete = useCallback(() => {
    themeLayer.playSound('node-delete')
  }, [themeLayer])

  const playEdgeConnect = useCallback(() => {
    themeLayer.playSound('edge-connect')
  }, [themeLayer])

  const playSuccess = useCallback(() => {
    themeLayer.playSound('success')
  }, [themeLayer])

  const playError = useCallback(() => {
    themeLayer.playSound('error')
  }, [themeLayer])

  return {
    playNodeClick,
    playNodeDrop,
    playNodeCreate,
    playNodeDelete,
    playEdgeConnect,
    playSuccess,
    playError,
    isEnabled: themeLayer.theme === 'halloween' && themeLayer.soundsEnabled && themeLayer.effectsEnabled,
  }
}

/**
 * Hook that combines all Halloween theme layer features
 */
export function useHalloweenTheme() {
  const themeLayer = useThemeLayer()
  const nodeSkins = useHalloweenNodeSkin()
  const edgeSkins = useHalloweenEdgeSkin()
  const sounds = useHalloweenSounds()

  const isActive = themeLayer.theme === 'halloween'
  const effectsEnabled = themeLayer.effectsEnabled
  const soundsEnabled = themeLayer.soundsEnabled
  const intensity = themeLayer.intensity

  return useMemo(() => ({
    // State
    isActive,
    effectsEnabled,
    soundsEnabled,
    intensity,

    // Node skins
    getNodeSkin: nodeSkins.getNodeSkin,
    getCombinedNodeSkin: nodeSkins.getCombinedNodeSkin,

    // Edge skins
    getEdgeSkin: edgeSkins.getEdgeSkin,
    getEdgeSkinForState: edgeSkins.getEdgeSkinForState,

    // Sounds
    playNodeClick: sounds.playNodeClick,
    playNodeDrop: sounds.playNodeDrop,
    playNodeCreate: sounds.playNodeCreate,
    playNodeDelete: sounds.playNodeDelete,
    playEdgeConnect: sounds.playEdgeConnect,
    playSuccess: sounds.playSuccess,
    playError: sounds.playError,

    // Controls
    toggleEffects: themeLayer.toggleEffects,
    toggleSounds: themeLayer.toggleSounds,
    setIntensity: themeLayer.setIntensity,

    // Templates
    getCardTemplates: themeLayer.getCardTemplates,

    // Plugins
    registerPlugin: themeLayer.registerPlugin,
    unregisterPlugin: themeLayer.unregisterPlugin,
  }), [
    isActive,
    effectsEnabled,
    soundsEnabled,
    intensity,
    nodeSkins,
    edgeSkins,
    sounds,
    themeLayer,
  ])
}
