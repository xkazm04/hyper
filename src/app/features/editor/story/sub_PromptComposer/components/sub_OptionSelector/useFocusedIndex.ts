import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseFocusedIndexOptions<T> {
  items: T[]
  numColumns?: number
  getLabel: (item: T) => string
  onSelect?: (item: T, index: number) => void
  onEscape?: () => void
  isEnabled?: boolean
}

export interface UseFocusedIndexReturn {
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  resetFocus: () => void
  typeAheadBuffer: string
}

/**
 * A utility hook for managing keyboard-first navigation in option lists.
 * Supports arrow-key traversal, enter/space selection, home/end navigation,
 * escape handling, and type-ahead filtering.
 *
 * @example
 * const { focusedIndex, handleKeyDown, setFocusedIndex } = useFocusedIndex({
 *   items: options,
 *   numColumns: 4,
 *   getLabel: (opt) => opt.label,
 *   onSelect: (opt) => selectOption(opt),
 *   onEscape: () => closePanel()
 * })
 */
export function useFocusedIndex<T>({
  items,
  numColumns = 1,
  getLabel,
  onSelect,
  onEscape,
  isEnabled = true
}: UseFocusedIndexOptions<T>): UseFocusedIndexReturn {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [typeAheadBuffer, setTypeAheadBuffer] = useState('')
  const typeAheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear type-ahead buffer after delay
  useEffect(() => {
    if (typeAheadBuffer) {
      typeAheadTimeoutRef.current = setTimeout(() => {
        setTypeAheadBuffer('')
      }, 800)
    }

    return () => {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current)
      }
    }
  }, [typeAheadBuffer])

  // Reset focus when items change or component is disabled
  useEffect(() => {
    if (!isEnabled) {
      setFocusedIndex(-1)
      setTypeAheadBuffer('')
    }
  }, [isEnabled])

  const resetFocus = useCallback(() => {
    setFocusedIndex(-1)
    setTypeAheadBuffer('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEnabled || items.length === 0) return

    const numItems = items.length
    let newIndex = focusedIndex

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        newIndex = Math.min(focusedIndex + 1, numItems - 1)
        if (focusedIndex === -1) newIndex = 0
        break

      case 'ArrowLeft':
        e.preventDefault()
        newIndex = Math.max(focusedIndex - 1, 0)
        if (focusedIndex === -1) newIndex = 0
        break

      case 'ArrowDown':
        e.preventDefault()
        if (focusedIndex === -1) {
          newIndex = 0
        } else {
          newIndex = Math.min(focusedIndex + numColumns, numItems - 1)
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (focusedIndex === -1) {
          newIndex = 0
        } else {
          newIndex = Math.max(focusedIndex - numColumns, 0)
        }
        break

      case 'Home':
        e.preventDefault()
        newIndex = 0
        break

      case 'End':
        e.preventDefault()
        newIndex = numItems - 1
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < numItems) {
          onSelect?.(items[focusedIndex], focusedIndex)
        }
        return

      case 'Escape':
        e.preventDefault()
        onEscape?.()
        return

      default:
        // Type-ahead: filter by first character(s) of label
        if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          e.preventDefault()
          const newBuffer = typeAheadBuffer + e.key.toLowerCase()
          setTypeAheadBuffer(newBuffer)

          // Find first matching item starting from current position
          const searchStart = focusedIndex >= 0 ? focusedIndex : 0

          // Search from current position to end
          for (let i = searchStart; i < numItems; i++) {
            const label = getLabel(items[i]).toLowerCase()
            if (label.startsWith(newBuffer)) {
              setFocusedIndex(i)
              return
            }
          }

          // Wrap around to beginning
          for (let i = 0; i < searchStart; i++) {
            const label = getLabel(items[i]).toLowerCase()
            if (label.startsWith(newBuffer)) {
              setFocusedIndex(i)
              return
            }
          }

          // If no match found with accumulated buffer, try just the new character
          if (newBuffer.length > 1) {
            const singleChar = e.key.toLowerCase()
            for (let i = 0; i < numItems; i++) {
              const label = getLabel(items[i]).toLowerCase()
              if (label.startsWith(singleChar)) {
                setFocusedIndex(i)
                setTypeAheadBuffer(singleChar)
                return
              }
            }
          }
        }
        return
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex)
    }
  }, [focusedIndex, items, numColumns, onSelect, onEscape, isEnabled, typeAheadBuffer, getLabel])

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    resetFocus,
    typeAheadBuffer
  }
}
