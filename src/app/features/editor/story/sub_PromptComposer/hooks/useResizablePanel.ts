'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'prompt-composer-panel-width'
const DEFAULT_WIDTH_PERCENT = 55 // Default: options take 55%, preview takes 45%
const MIN_WIDTH_PERCENT = 25
const MAX_WIDTH_PERCENT = 75
const COLLAPSE_THRESHOLD_PX = 600 // Viewport width below which we collapse

export interface UseResizablePanelReturn {
  /** Current width percentage of the left panel (0-100) */
  leftPanelWidth: number
  /** Whether the panel is collapsed to icon mode on narrow viewports */
  isCollapsed: boolean
  /** Whether currently dragging the splitter */
  isDragging: boolean
  /** Start drag operation */
  startDrag: (clientX: number) => void
  /** Handle drag movement */
  onDrag: (clientX: number) => void
  /** End drag operation */
  endDrag: () => void
  /** Reset to default width */
  resetWidth: () => void
  /** Container ref to attach for measuring */
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useResizablePanel(): UseResizablePanelReturn {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_WIDTH_PERCENT)
  const [isDragging, setIsDragging] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const dragStartX = useRef<number>(0)
  const dragStartWidth = useRef<number>(DEFAULT_WIDTH_PERCENT)

  // Load saved width from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed) && parsed >= MIN_WIDTH_PERCENT && parsed <= MAX_WIDTH_PERCENT) {
        setLeftPanelWidth(parsed)
      }
    }
  }, [])

  // Check viewport width for collapse behavior
  useEffect(() => {
    const checkWidth = () => {
      const container = containerRef.current
      if (container) {
        setIsCollapsed(container.offsetWidth < COLLAPSE_THRESHOLD_PX)
      } else {
        setIsCollapsed(window.innerWidth < COLLAPSE_THRESHOLD_PX)
      }
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Save to localStorage when width changes (debounced during drag)
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(STORAGE_KEY, leftPanelWidth.toString())
    }
  }, [leftPanelWidth, isDragging])

  const startDrag = useCallback((clientX: number) => {
    setIsDragging(true)
    dragStartX.current = clientX
    dragStartWidth.current = leftPanelWidth
  }, [leftPanelWidth])

  const onDrag = useCallback((clientX: number) => {
    if (!isDragging) return

    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width

    // Calculate the new width based on mouse position
    const mouseX = clientX - containerRect.left
    const newWidthPercent = (mouseX / containerWidth) * 100

    // Clamp to min/max
    const clampedWidth = Math.max(
      MIN_WIDTH_PERCENT,
      Math.min(MAX_WIDTH_PERCENT, newWidthPercent)
    )

    setLeftPanelWidth(clampedWidth)
  }, [isDragging])

  const endDrag = useCallback(() => {
    setIsDragging(false)
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, leftPanelWidth.toString())
  }, [leftPanelWidth])

  const resetWidth = useCallback(() => {
    setLeftPanelWidth(DEFAULT_WIDTH_PERCENT)
    localStorage.setItem(STORAGE_KEY, DEFAULT_WIDTH_PERCENT.toString())
  }, [])

  return {
    leftPanelWidth,
    isCollapsed,
    isDragging,
    startDrag,
    onDrag,
    endDrag,
    resetWidth,
    containerRef,
  }
}
