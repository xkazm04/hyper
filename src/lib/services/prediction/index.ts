// Re-export types
export { DEFAULT_PREFERENCES } from './types'
export type { PreferencesDbRow, HistoryDbRow } from './types'

// Re-export model utilities
export {
  mapPreferencesFromDb,
  mapHistoryFromDb,
  calculateSuggestionPositions,
} from './models'

// Re-export cache operations
export {
  getUserPreferencesFromDb,
  createUserPreferencesInDb,
  updateUserPreferencesInDb,
  recordSuggestionInDb,
  updateSuggestionOutcomeInDb,
} from './cache'

// Re-export engine
export { AIPredictionService, aiPredictionService } from './engine'
