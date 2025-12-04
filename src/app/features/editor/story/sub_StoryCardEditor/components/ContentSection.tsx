'use client'

/**
 * ContentSection - Story card content editor
 *
 * This file now re-exports the view-first ContentSectionViewMode component
 * which provides a cleaner, more readable interface:
 * - Title and content shown as readable text (click to edit)
 * - Dialogue shown as formatted quote (click to edit)
 * - Choices shown as compact list (click to edit)
 *
 * The old always-edit components (ContentEditor, ContentToolbar, ChoiceEditor)
 * are preserved for backwards compatibility but are no longer used by default.
 */

export { ContentSectionViewMode as ContentSection } from '../../sub_ContentSection/ContentSectionViewMode'

// Re-export the old components for backwards compatibility if needed
export { ContentEditor } from '../../sub_ContentSection/ContentEditor'
export { ContentToolbar } from '../../sub_ContentSection/ContentToolbar'

// Export view-mode components for direct use
export { EditableField } from '../../sub_ContentSection/EditableField'
export { ContentEditorViewMode } from '../../sub_ContentSection/ContentEditorViewMode'
export { DialogueViewMode } from '../../sub_ContentSection/DialogueViewMode'
export { ChoiceListViewMode } from '../../sub_ContentSection/ChoiceListViewMode'
