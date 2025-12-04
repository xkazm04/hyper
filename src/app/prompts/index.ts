/**
 * Shared Prompts Directory
 *
 * Central location for all AI prompt templates, system prompts, and prompt utilities.
 * This module organizes prompts by domain for maintainability and reusability.
 */

// Core types used across all prompt modules
export * from './types'

// Art styles configuration
export * from './artstyles'

// Card/Scene prompts (settings, moods)
export * from './cards'

// Character generation prompts (archetypes, poses, expressions, system prompts)
export * from './character'

// Scene description prompts (visual description generation from narrative)
export * from './scene'
