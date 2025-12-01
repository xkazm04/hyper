'use client'

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
  return (
    <OutlineSidebar
      onAddCard={onAddCard}
    />
  )
}
