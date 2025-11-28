'use client'

import { useState } from 'react'
import { OutlineSidebar } from './sub_OutlineSidebar'

interface CardListProps {
  onAddCard: () => void
}

/**
 * CardList - Wrapper component that renders the OutlineSidebar
 * This maintains backward compatibility with existing usages while
 * providing the enhanced hierarchical outline functionality.
 */
export default function CardList({ onAddCard }: CardListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <OutlineSidebar
      onAddCard={onAddCard}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
    />
  )
}
