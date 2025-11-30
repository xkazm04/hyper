/**
 * ChoiceEditor Module
 *
 * Unified module for choice editing functionality.
 * Supports three modes:
 * - inline: Header-only mode with add button and AI suggestions (for embedding in larger editors)
 * - standalone: Full CRUD mode with complete state management (legacy API)
 * - integrated: Full CRUD mode using useChoicesSection hook
 */

export { ChoiceEditor, type ChoiceEditorProps, default as ChoiceEditorDefault } from './ChoiceEditor'
export { ChoiceEditorHeader, type ChoiceEditorHeaderProps } from './components/ChoiceEditorHeader'
export { ChoiceForm, type ChoiceFormProps } from './components/ChoiceForm'
export { ChoiceTargets, type ChoiceTargetsProps } from './components/ChoiceTargets'
export { ChoiceConditions, type ChoiceConditionsProps } from './components/ChoiceConditions'
export { ChoiceItem, type ChoiceItemProps } from './components/ChoiceItem'
export { ChoiceList, type ChoiceListProps } from './components/ChoiceList'
export { useChoicesSection, type UseChoicesSectionProps } from './hooks/useChoicesSection'
