/**
 * Unified Graph Validation Hook
 *
 * Provides comprehensive validation for story graph data including:
 * - Missing required fields detection
 * - Unreachable node identification
 * - Inconsistent relationship detection
 * - Actionable fix suggestions
 * - State management for validation UI
 */

import { useMemo, useCallback, useState } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { StoryService } from '@/lib/services/story/index'
import { createClient } from '@/lib/supabase/client'
import { StoryStack, StoryCard, Choice } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info'

export type ValidationCategory =
  | 'missing_field'
  | 'unreachable_node'
  | 'invalid_relationship'
  | 'dead_end'
  | 'orphan'
  | 'circular_reference'
  | 'incomplete_content'
  | 'configuration'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  category: ValidationCategory
  cardId: string | null
  choiceId: string | null
  title: string
  message: string
  fix: ValidationFix | null
}

export interface ValidationFix {
  type: 'auto' | 'manual' | 'navigate'
  label: string
  action: FixAction
}

export type FixAction =
  | { type: 'set_first_card'; cardId: string }
  | { type: 'delete_choice'; choiceId: string }
  | { type: 'delete_card'; cardId: string }
  | { type: 'navigate_to_card'; cardId: string }
  | { type: 'add_choice'; fromCardId: string }
  | { type: 'update_choice_target'; choiceId: string; targetCardId: string }
  | { type: 'update_card_field'; cardId: string; field: string }

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  stats: ValidationStats
}

export interface ValidationStats {
  totalCards: number
  totalChoices: number
  errorsCount: number
  warningsCount: number
  infosCount: number
  reachableCards: number
  orphanedCards: number
  deadEndCards: number
  incompleteCards: number
}

export interface UseGraphValidationReturn {
  validationResult: ValidationResult
  applyFix: (action: FixAction) => Promise<void>
  navigateToCard: (cardId: string) => void
  isApplyingFix: boolean
  isDiagnosticsVisible: boolean
  toggleDiagnosticsVisibility: () => void
  filterIssuesBySeverity: (severities: ValidationSeverity[]) => ValidationIssue[]
  filterIssuesByCategory: (categories: ValidationCategory[]) => ValidationIssue[]
  getIssuesForCard: (cardId: string) => ValidationIssue[]
}

// ============================================================================
// Validation Rules
// ============================================================================

interface ValidationContext {
  storyStack: StoryStack
  storyCards: StoryCard[]
  choices: Choice[]
  cardMap: Map<string, StoryCard>
  choicesByCardId: Map<string, Choice[]>
  incomingChoicesCount: Map<string, number>
  reachableCardIds: Set<string>
}

type ValidationRule = (ctx: ValidationContext) => ValidationIssue[]

/**
 * Rule: Check if first card is set
 */
const checkFirstCardSet: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  if (!ctx.storyStack.firstCardId) {
    // Suggest setting the first created card as the entry point
    const suggestedFirstCard = ctx.storyCards[0]
    issues.push({
      id: 'no-first-card',
      severity: 'error',
      category: 'configuration',
      cardId: null,
      choiceId: null,
      title: 'No entry point set',
      message: 'The story has no starting card. Set a first card to define where the story begins.',
      fix: suggestedFirstCard
        ? {
            type: 'auto',
            label: `Set "${suggestedFirstCard.title || 'Untitled'}" as first card`,
            action: { type: 'set_first_card', cardId: suggestedFirstCard.id },
          }
        : null,
    })
  } else if (!ctx.cardMap.has(ctx.storyStack.firstCardId)) {
    // First card reference is invalid
    const suggestedFirstCard = ctx.storyCards[0]
    issues.push({
      id: 'invalid-first-card',
      severity: 'error',
      category: 'invalid_relationship',
      cardId: ctx.storyStack.firstCardId,
      choiceId: null,
      title: 'Invalid entry point',
      message: 'The first card reference points to a non-existent card.',
      fix: suggestedFirstCard
        ? {
            type: 'auto',
            label: `Set "${suggestedFirstCard.title || 'Untitled'}" as first card`,
            action: { type: 'set_first_card', cardId: suggestedFirstCard.id },
          }
        : null,
    })
  }

  return issues
}

/**
 * Rule: Check for orphaned cards (no incoming links from other cards)
 *
 * A card is orphaned if:
 * - It is not the first card AND
 * - No other card has a choice pointing to it
 *
 * This matches the logic in useGraphOperations for consistency with StatsOverview.
 */
const checkOrphanedCards: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const card of ctx.storyCards) {
    // Skip the first card - it's the entry point
    if (card.id === ctx.storyStack.firstCardId) continue

    // Check if any choice targets this card
    const hasIncomingLink = (ctx.incomingChoicesCount.get(card.id) ?? 0) > 0

    if (!hasIncomingLink) {
      // Find cards that could link to this orphan (any card with outgoing choices)
      const potentialParents = ctx.storyCards.filter(
        (c) => c.id !== card.id
      )
      const suggestedParent = potentialParents[0]

      issues.push({
        id: `orphan-${card.id}`,
        severity: 'warning',
        category: 'orphan',
        cardId: card.id,
        choiceId: null,
        title: 'Orphaned scene',
        message: `"${card.title || 'Untitled'}" has no incoming links from other scenes.`,
        fix: suggestedParent
          ? {
              type: 'navigate',
              label: `Navigate to add a choice from "${suggestedParent.title || 'Untitled'}"`,
              action: { type: 'navigate_to_card', cardId: suggestedParent.id },
            }
          : card.id !== ctx.storyStack.firstCardId
            ? {
                type: 'auto',
                label: 'Set as first card',
                action: { type: 'set_first_card', cardId: card.id },
              }
            : null,
      })
    }
  }

  return issues
}

/**
 * Rule: Check for dead end cards (no outgoing choices, not intentional endings)
 */
const checkDeadEndCards: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const card of ctx.storyCards) {
    const cardChoices = ctx.choicesByCardId.get(card.id) || []

    if (cardChoices.length === 0) {
      // Check if card has content suggesting it's an ending
      const contentLower = (card.content || '').toLowerCase()
      const isLikelyEnding =
        contentLower.includes('the end') ||
        contentLower.includes('game over') ||
        contentLower.includes('congratulations') ||
        contentLower.includes('you win') ||
        contentLower.includes('you lose') ||
        contentLower.includes('thanks for playing')

      if (!isLikelyEnding) {
        issues.push({
          id: `dead-end-${card.id}`,
          severity: 'warning',
          category: 'dead_end',
          cardId: card.id,
          choiceId: null,
          title: 'Dead end scene',
          message: `"${card.title || 'Untitled'}" has no choices for the player to continue.`,
          fix: {
            type: 'navigate',
            label: 'Add a choice',
            action: { type: 'add_choice', fromCardId: card.id },
          },
        })
      }
    }
  }

  return issues
}

/**
 * Rule: Check for choices pointing to non-existent cards
 */
const checkInvalidChoiceTargets: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const choice of ctx.choices) {
    if (!choice.targetCardId) {
      // Choice has no target
      issues.push({
        id: `no-target-${choice.id}`,
        severity: 'error',
        category: 'invalid_relationship',
        cardId: choice.storyCardId,
        choiceId: choice.id,
        title: 'Choice without destination',
        message: `Choice "${choice.label || 'Untitled'}" has no target card.`,
        fix: {
          type: 'navigate',
          label: 'Edit choice',
          action: { type: 'navigate_to_card', cardId: choice.storyCardId },
        },
      })
    } else if (!ctx.cardMap.has(choice.targetCardId)) {
      // Target card doesn't exist
      issues.push({
        id: `invalid-target-${choice.id}`,
        severity: 'error',
        category: 'invalid_relationship',
        cardId: choice.storyCardId,
        choiceId: choice.id,
        title: 'Invalid choice target',
        message: `Choice "${choice.label || 'Untitled'}" points to a non-existent card.`,
        fix: {
          type: 'auto',
          label: 'Delete this choice',
          action: { type: 'delete_choice', choiceId: choice.id },
        },
      })
    }
  }

  return issues
}

/**
 * Rule: Check for incomplete card content
 */
const checkIncompleteCards: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const card of ctx.storyCards) {
    const missingFields: string[] = []

    if (!card.title || card.title.trim() === '' || card.title === 'Untitled Card') {
      missingFields.push('title')
    }
    if (!card.content || card.content.trim() === '') {
      missingFields.push('content')
    }
    if (!card.imageUrl) {
      missingFields.push('image')
    }

    if (missingFields.length > 0) {
      issues.push({
        id: `incomplete-${card.id}`,
        severity: 'info',
        category: 'incomplete_content',
        cardId: card.id,
        choiceId: null,
        title: 'Incomplete scene',
        message: `"${card.title || 'Untitled'}" is missing: ${missingFields.join(', ')}.`,
        fix: {
          type: 'navigate',
          label: 'Complete this scene',
          action: { type: 'navigate_to_card', cardId: card.id },
        },
      })
    }
  }

  return issues
}

/**
 * Rule: Check for circular references (self-referencing choices)
 */
const checkCircularReferences: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const choice of ctx.choices) {
    if (choice.targetCardId === choice.storyCardId) {
      issues.push({
        id: `self-ref-${choice.id}`,
        severity: 'warning',
        category: 'circular_reference',
        cardId: choice.storyCardId,
        choiceId: choice.id,
        title: 'Self-referencing choice',
        message: `Choice "${choice.label || 'Untitled'}" points back to its own card.`,
        fix: {
          type: 'navigate',
          label: 'Edit choice target',
          action: { type: 'navigate_to_card', cardId: choice.storyCardId },
        },
      })
    }
  }

  return issues
}

/**
 * Rule: Check for duplicate choice labels on the same card
 */
const checkDuplicateChoiceLabels: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const card of ctx.storyCards) {
    const cardChoices = ctx.choicesByCardId.get(card.id) || []
    const labelCounts = new Map<string, Choice[]>()

    for (const choice of cardChoices) {
      const label = (choice.label || '').toLowerCase().trim()
      if (label) {
        const existing = labelCounts.get(label) || []
        existing.push(choice)
        labelCounts.set(label, existing)
      }
    }

    for (const [label, duplicates] of labelCounts) {
      if (duplicates.length > 1) {
        issues.push({
          id: `dup-label-${card.id}-${label}`,
          severity: 'info',
          category: 'configuration',
          cardId: card.id,
          choiceId: duplicates[0].id,
          title: 'Duplicate choice labels',
          message: `Card has ${duplicates.length} choices with label "${label}".`,
          fix: {
            type: 'navigate',
            label: 'Review choices',
            action: { type: 'navigate_to_card', cardId: card.id },
          },
        })
      }
    }
  }

  return issues
}

/**
 * Rule: Check for empty choice labels
 */
const checkEmptyChoiceLabels: ValidationRule = (ctx) => {
  const issues: ValidationIssue[] = []

  for (const choice of ctx.choices) {
    if (!choice.label || choice.label.trim() === '') {
      issues.push({
        id: `empty-label-${choice.id}`,
        severity: 'warning',
        category: 'missing_field',
        cardId: choice.storyCardId,
        choiceId: choice.id,
        title: 'Empty choice label',
        message: 'A choice has no visible text for players.',
        fix: {
          type: 'navigate',
          label: 'Edit choice',
          action: { type: 'navigate_to_card', cardId: choice.storyCardId },
        },
      })
    }
  }

  return issues
}

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * All validation rules to run
 */
const validationRules: ValidationRule[] = [
  checkFirstCardSet,
  checkOrphanedCards,
  checkDeadEndCards,
  checkInvalidChoiceTargets,
  checkIncompleteCards,
  checkCircularReferences,
  checkDuplicateChoiceLabels,
  checkEmptyChoiceLabels,
]

/**
 * Compute set of reachable card IDs from the first card using BFS
 */
function computeReachableCards(
  firstCardId: string | null,
  choices: Choice[],
  cardMap: Map<string, StoryCard>
): Set<string> {
  const reachable = new Set<string>()

  if (!firstCardId || !cardMap.has(firstCardId)) {
    return reachable
  }

  const queue = [firstCardId]
  reachable.add(firstCardId)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const outgoingChoices = choices.filter((c) => c.storyCardId === currentId)

    for (const choice of outgoingChoices) {
      if (choice.targetCardId && cardMap.has(choice.targetCardId) && !reachable.has(choice.targetCardId)) {
        reachable.add(choice.targetCardId)
        queue.push(choice.targetCardId)
      }
    }
  }

  return reachable
}

/**
 * Validate the story graph and return all issues found
 */
function validateGraph(
  storyStack: StoryStack | null,
  storyCards: StoryCard[],
  choices: Choice[]
): ValidationResult {
  // Early return if no story stack
  if (!storyStack) {
    return {
      isValid: true,
      issues: [],
      stats: {
        totalCards: 0,
        totalChoices: 0,
        errorsCount: 0,
        warningsCount: 0,
        infosCount: 0,
        reachableCards: 0,
        orphanedCards: 0,
        deadEndCards: 0,
        incompleteCards: 0,
      },
    }
  }

  // Build lookup structures
  const cardMap = new Map<string, StoryCard>()
  for (const card of storyCards) {
    cardMap.set(card.id, card)
  }

  const choicesByCardId = new Map<string, Choice[]>()
  const incomingChoicesCount = new Map<string, number>()

  for (const choice of choices) {
    // Group by source card
    const existing = choicesByCardId.get(choice.storyCardId) || []
    existing.push(choice)
    choicesByCardId.set(choice.storyCardId, existing)

    // Count incoming connections
    if (choice.targetCardId) {
      incomingChoicesCount.set(choice.targetCardId, (incomingChoicesCount.get(choice.targetCardId) || 0) + 1)
    }
  }

  // Compute reachability
  const reachableCardIds = computeReachableCards(storyStack.firstCardId, choices, cardMap)

  // Build validation context
  const ctx: ValidationContext = {
    storyStack,
    storyCards,
    choices,
    cardMap,
    choicesByCardId,
    incomingChoicesCount,
    reachableCardIds,
  }

  // Run all validation rules
  const allIssues: ValidationIssue[] = []
  for (const rule of validationRules) {
    const issues = rule(ctx)
    allIssues.push(...issues)
  }

  // Sort issues by severity (errors first, then warnings, then info)
  const severityOrder: Record<ValidationSeverity, number> = { error: 0, warning: 1, info: 2 }
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Compute stats
  const errorsCount = allIssues.filter((i) => i.severity === 'error').length
  const warningsCount = allIssues.filter((i) => i.severity === 'warning').length
  const infosCount = allIssues.filter((i) => i.severity === 'info').length
  const orphanedCards = allIssues.filter((i) => i.category === 'orphan').length
  const deadEndCards = allIssues.filter((i) => i.category === 'dead_end').length
  const incompleteCards = allIssues.filter((i) => i.category === 'incomplete_content').length

  return {
    isValid: errorsCount === 0,
    issues: allIssues,
    stats: {
      totalCards: storyCards.length,
      totalChoices: choices.length,
      errorsCount,
      warningsCount,
      infosCount,
      reachableCards: reachableCardIds.size,
      orphanedCards,
      deadEndCards,
      incompleteCards,
    },
  }
}

// ============================================================================
// Main Hook
// ============================================================================

export function useGraphValidation(): UseGraphValidationReturn {
  const {
    storyStack,
    storyCards,
    choices,
    setCurrentCardId,
    setStoryStack,
    deleteChoice,
    deleteCard,
  } = useEditor()

  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [isDiagnosticsVisible, setIsDiagnosticsVisible] = useState(false)

  // Compute validation result with memoization
  const validationResult = useMemo(() => {
    return validateGraph(storyStack, storyCards, choices)
  }, [storyStack, storyCards, choices])

  // Navigate to a specific card
  const navigateToCard = useCallback(
    (cardId: string) => {
      setCurrentCardId(cardId)
    },
    [setCurrentCardId]
  )

  // Toggle diagnostics visibility
  const toggleDiagnosticsVisibility = useCallback(() => {
    setIsDiagnosticsVisible((prev) => !prev)
  }, [])

  // Filter issues by severity
  const filterIssuesBySeverity = useCallback(
    (severities: ValidationSeverity[]): ValidationIssue[] => {
      return validationResult.issues.filter((issue) => severities.includes(issue.severity))
    },
    [validationResult.issues]
  )

  // Filter issues by category
  const filterIssuesByCategory = useCallback(
    (categories: ValidationCategory[]): ValidationIssue[] => {
      return validationResult.issues.filter((issue) => categories.includes(issue.category))
    },
    [validationResult.issues]
  )

  // Get issues for a specific card
  const getIssuesForCard = useCallback(
    (cardId: string): ValidationIssue[] => {
      return validationResult.issues.filter((issue) => issue.cardId === cardId)
    },
    [validationResult.issues]
  )

  // Apply a fix action
  const applyFix = useCallback(
    async (action: FixAction) => {
      if (!storyStack) return

      setIsApplyingFix(true)

      try {
        const supabase = createClient()
        const storyService = new StoryService(supabase)

        switch (action.type) {
          case 'set_first_card': {
            // Update the story stack with new first card
            const updatedStack = await storyService.updateStoryStack(storyStack.id, {
              firstCardId: action.cardId,
            })
            if (updatedStack) {
              setStoryStack(updatedStack)
            }
            break
          }

          case 'delete_choice': {
            // Delete the invalid choice
            await storyService.deleteChoice(action.choiceId)
            deleteChoice(action.choiceId)
            break
          }

          case 'delete_card': {
            // Delete the orphaned card
            await storyService.deleteStoryCard(action.cardId)
            deleteCard(action.cardId)
            break
          }

          case 'navigate_to_card': {
            // Just navigate to the card
            navigateToCard(action.cardId)
            break
          }

          case 'add_choice': {
            // Navigate to the card to add a choice
            navigateToCard(action.fromCardId)
            break
          }

          case 'update_choice_target': {
            // Update the choice with new target
            await storyService.updateChoice(action.choiceId, {
              targetCardId: action.targetCardId,
            })
            break
          }

          case 'update_card_field': {
            // Navigate to the card to update the field
            navigateToCard(action.cardId)
            break
          }
        }
      } catch (error) {
        console.error('Failed to apply fix:', error)
      } finally {
        setIsApplyingFix(false)
      }
    },
    [storyStack, setStoryStack, deleteChoice, deleteCard, navigateToCard]
  )

  return {
    validationResult,
    applyFix,
    navigateToCard,
    isApplyingFix,
    isDiagnosticsVisible,
    toggleDiagnosticsVisibility,
    filterIssuesBySeverity,
    filterIssuesByCategory,
    getIssuesForCard,
  }
}
