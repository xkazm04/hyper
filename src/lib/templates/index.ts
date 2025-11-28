// Barrel file for templates - Re-exports all template types and data

// Type definitions
export type { StackTemplateCard, StackTemplate } from './basic'

// Individual templates
export { interactiveTutorialTemplate } from './basic'
export { chooseAdventureTemplate } from './advanced'
export { flashcardStudyTemplate } from './presets'

// Combined templates array for backward compatibility
import { interactiveTutorialTemplate } from './basic'
import { chooseAdventureTemplate } from './advanced'
import { flashcardStudyTemplate } from './presets'
import type { StackTemplate } from './basic'

export const stackTemplates: StackTemplate[] = [
  interactiveTutorialTemplate,
  chooseAdventureTemplate,
  flashcardStudyTemplate,
]
