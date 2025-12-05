/**
 * Sidebar Navigation Store
 *
 * Zustand store for managing shared navigation state between sidebars
 * and the main editor layout. Allows sidebar items to switch the main
 * editor tab when clicked.
 */

import { create } from 'zustand'

export type EditorTab = 'story' | 'cards' | 'characters'

interface SidebarNavigationState {
  /** Currently active editor tab */
  activeTab: EditorTab
  /** Set the active editor tab */
  setActiveTab: (tab: EditorTab) => void
  /** Switch to cards tab (for outline sidebar) */
  switchToCards: () => void
  /** Switch to characters tab (for character sidebar) */
  switchToCharacters: () => void
}

export const useSidebarNavigationStore = create<SidebarNavigationState>((set) => ({
  activeTab: 'cards',
  setActiveTab: (tab) => set({ activeTab: tab }),
  switchToCards: () => set({ activeTab: 'cards' }),
  switchToCharacters: () => set({ activeTab: 'characters' }),
}))

// Selectors for optimized re-renders
export const selectActiveTab = (state: SidebarNavigationState) => state.activeTab
export const selectSetActiveTab = (state: SidebarNavigationState) => state.setActiveTab
export const selectSwitchToCards = (state: SidebarNavigationState) => state.switchToCards
export const selectSwitchToCharacters = (state: SidebarNavigationState) => state.switchToCharacters
