/**
 * Command Script Execution Engine
 *
 * Compiles CommandScript objects into executable Command objects
 * and handles script execution with access to editor context and AI services.
 */

import type {
  CommandScript,
  ScriptAction,
  ScriptCondition,
  ScriptValue,
  ScriptExecutionContext,
  ScriptExecutionResult,
  ContextPath,
} from './types'
import type { Command, CommandCategory } from '../../types'
import type { StoryCard, Character, Choice } from '@/lib/types'

// Icon imports from lucide-react
import {
  Wand2,
  Sparkles,
  Bot,
  Zap,
  Play,
  FileText,
  Users,
  Eye,
  Layout,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  MessageSquare,
  Image,
  Send,
  Upload,
  Download,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  wand: Wand2,
  sparkles: Sparkles,
  bot: Bot,
  zap: Zap,
  play: Play,
  file: FileText,
  users: Users,
  eye: Eye,
  layout: Layout,
  settings: Settings,
  refresh: RefreshCw,
  plus: Plus,
  trash: Trash2,
  copy: Copy,
  message: MessageSquare,
  image: Image,
  send: Send,
  upload: Upload,
  download: Download,
}

/**
 * Compile a CommandScript into an executable Command object
 */
export function compileScript(
  script: CommandScript,
  context: ScriptExecutionContext,
  executeScript: (script: CommandScript, ctx: ScriptExecutionContext) => Promise<ScriptExecutionResult>
): Command {
  // Check if the command should be disabled based on conditions
  const isDisabled = script.when ? !evaluateConditions(script.when, context) : false

  // Map category - use 'story' for custom categories not in the base list
  const category: CommandCategory = mapCategory(script.category)

  // Get icon component
  const iconComponent = script.icon ? ICON_MAP[script.icon.toLowerCase()] : Wand2

  return {
    id: `script:${script.id}`,
    label: script.label,
    description: script.description,
    icon: iconComponent,
    shortcut: script.shortcut,
    category,
    disabled: isDisabled,
    action: async () => {
      const result = await executeScript(script, context)
      if (!result.success && result.error) {
        context.services.notify(result.error, 'error')
      }
    },
  }
}

/**
 * Map extended categories to base command categories
 */
function mapCategory(category: string): CommandCategory {
  switch (category) {
    case 'navigation':
    case 'cards':
    case 'characters':
    case 'story':
    case 'view':
    case 'export':
      return category as CommandCategory
    case 'custom':
    case 'ai':
    case 'automation':
    default:
      return 'story' // Map custom categories to 'story'
  }
}

/**
 * Execute a command script
 */
export async function executeScript(
  script: CommandScript,
  context: ScriptExecutionContext
): Promise<ScriptExecutionResult> {
  // Check global conditions
  if (script.when && !evaluateConditions(script.when, context)) {
    return {
      success: false,
      error: 'Command conditions not met',
    }
  }

  // Execute actions in sequence
  for (const action of script.actions) {
    try {
      // Check action condition
      if (action.if && !evaluateCondition(action.if, context)) {
        continue // Skip this action
      }

      const result = await executeAction(action, context)

      // Store result if requested
      if (action.storeAs && result !== undefined) {
        context.variables.set(action.storeAs, result)
      }
    } catch (error) {
      return {
        success: false,
        error: `Action "${action.type}" failed: ${(error as Error).message}`,
      }
    }
  }

  return {
    success: true,
    variables: Object.fromEntries(context.variables),
  }
}

/**
 * Execute a single action
 */
async function executeAction(
  action: ScriptAction,
  context: ScriptExecutionContext
): Promise<unknown> {
  const params = action.params || {}

  switch (action.type) {
    case 'navigate':
      return handleNavigate(params, context)

    case 'card.create':
      return handleCardCreate(params, context)

    case 'card.update':
      return handleCardUpdate(params, context)

    case 'card.delete':
      return handleCardDelete(params, context)

    case 'card.duplicate':
      return handleCardDuplicate(params, context)

    case 'card.select':
      return handleCardSelect(params, context)

    case 'character.create':
      return handleCharacterCreate(params, context)

    case 'character.update':
      return handleCharacterUpdate(params, context)

    case 'character.select':
      return handleCharacterSelect(params, context)

    case 'choice.create':
      return handleChoiceCreate(params, context)

    case 'choice.delete':
      return handleChoiceDelete(params, context)

    case 'ai.complete':
      return handleAiComplete(params, context)

    case 'ai.generateImage':
      return handleAiGenerateImage(params, context)

    case 'ai.generateChoices':
      return handleAiGenerateChoices(params, context)

    case 'ai.generateContent':
      return handleAiGenerateContent(params, context)

    case 'export.json':
      return handleExportJson(params, context)

    case 'export.story':
      return handleExportStory(params, context)

    case 'ui.notify':
      return handleUiNotify(params, context)

    case 'ui.confirm':
      return handleUiConfirm(params, context)

    case 'ui.prompt':
      return handleUiPrompt(params, context)

    case 'view.toggle':
      return handleViewToggle(params, context)

    case 'publish':
      return handlePublish(params, context)

    case 'unpublish':
      return handleUnpublish(params, context)

    case 'custom':
      // Custom actions are no-ops by default, can be extended
      return undefined

    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

/**
 * Evaluate multiple conditions (AND logic)
 */
function evaluateConditions(conditions: ScriptCondition[], context: ScriptExecutionContext): boolean {
  return conditions.every((cond) => evaluateCondition(cond, context))
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: ScriptCondition, context: ScriptExecutionContext): boolean {
  const pathValue = resolvePath(condition.path, context)
  const compareValue = condition.value !== undefined ? resolveValue(condition.value, context) : undefined

  switch (condition.operator) {
    case 'exists':
      return pathValue !== null && pathValue !== undefined
    case 'not_exists':
      return pathValue === null || pathValue === undefined
    case 'equals':
      return pathValue === compareValue
    case 'not_equals':
      return pathValue !== compareValue
    case 'gt':
      return typeof pathValue === 'number' && typeof compareValue === 'number' && pathValue > compareValue
    case 'gte':
      return typeof pathValue === 'number' && typeof compareValue === 'number' && pathValue >= compareValue
    case 'lt':
      return typeof pathValue === 'number' && typeof compareValue === 'number' && pathValue < compareValue
    case 'lte':
      return typeof pathValue === 'number' && typeof compareValue === 'number' && pathValue <= compareValue
    case 'contains':
      if (typeof pathValue === 'string' && typeof compareValue === 'string') {
        return pathValue.includes(compareValue)
      }
      if (Array.isArray(pathValue)) {
        return pathValue.includes(compareValue)
      }
      return false
    default:
      return false
  }
}

/**
 * Resolve a path (string or context reference) to a value
 */
function resolvePath(
  path: string | { $context: ContextPath | string },
  context: ScriptExecutionContext
): unknown {
  if (typeof path === 'string') {
    // Check if it's a variable
    if (context.variables.has(path)) {
      return context.variables.get(path)
    }
    // Otherwise treat as a context path
    return resolveContextPath(path as ContextPath, context)
  } else if (typeof path === 'object' && '$context' in path) {
    return resolveContextPath(path.$context, context)
  }
  return undefined
}

/**
 * Resolve a context path to a value
 */
function resolveContextPath(path: ContextPath | string, context: ScriptExecutionContext): unknown {
  const { editor } = context

  switch (path) {
    case 'currentCard':
      return editor.currentCard
    case 'currentCard.id':
      return editor.currentCardId
    case 'currentCard.title':
      return (editor.currentCard as StoryCard | null)?.title
    case 'currentCard.content':
      return (editor.currentCard as StoryCard | null)?.content
    case 'currentCard.imageUrl':
      return (editor.currentCard as StoryCard | null)?.imageUrl
    case 'currentCharacter':
      return editor.currentCharacter
    case 'currentCharacter.id':
      return editor.currentCharacterId
    case 'currentCharacter.name':
      return (editor.currentCharacter as Character | null)?.name
    case 'storyStack':
      return editor.storyStack
    case 'storyStack.id':
      return (editor.storyStack as { id?: string } | null)?.id
    case 'storyStack.name':
      return (editor.storyStack as { name?: string } | null)?.name
    case 'storyCards':
      return editor.storyCards
    case 'storyCards.length':
      return editor.storyCards.length
    case 'characters':
      return editor.characters
    case 'characters.length':
      return editor.characters.length
    case 'choices':
      return editor.choices
    default:
      return undefined
  }
}

/**
 * Resolve a ScriptValue to an actual value
 */
function resolveValue(value: ScriptValue, context: ScriptExecutionContext): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if ('$var' in value) {
    return context.variables.get(value.$var)
  }

  if ('$context' in value) {
    return resolveContextPath(value.$context, context)
  }

  if ('$expr' in value) {
    // Simple expression evaluation (limited for security)
    return evaluateExpression(value.$expr, context)
  }

  return value
}

/**
 * Evaluate a simple expression (very limited for security)
 */
function evaluateExpression(expr: string, context: ScriptExecutionContext): unknown {
  // Only allow simple string concatenation and property access
  // More complex expressions would need a proper parser

  // Replace context references
  let result = expr

  // Replace ${context.path} with values
  const contextRegex = /\$\{context\.([^}]+)\}/g
  result = result.replace(contextRegex, (_, path) => {
    const value = resolveContextPath(path as ContextPath, context)
    return String(value ?? '')
  })

  // Replace ${var.name} with variable values
  const varRegex = /\$\{var\.([^}]+)\}/g
  result = result.replace(varRegex, (_, name) => {
    const value = context.variables.get(name)
    return String(value ?? '')
  })

  return result
}

// Action handlers

async function handleNavigate(
  params: Record<string, ScriptValue>,
  _context: ScriptExecutionContext
): Promise<void> {
  const path = params.path as string
  if (path) {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }
}

async function handleCardCreate(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<unknown> {
  // This would need to be connected to the actual card creation service
  const title = resolveValue(params.title || 'New Card', context) as string
  const content = resolveValue(params.content || '', context) as string

  context.services.notify(`Created card: ${title}`, 'success')

  // Return mock data - real implementation would use StoryService
  return { id: `card-${Date.now()}`, title, content }
}

async function handleCardUpdate(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const cardId = resolveValue(params.cardId, context) as string || context.editor.currentCardId
  if (!cardId) {
    throw new Error('No card selected')
  }

  // In real implementation, this would call the update service
  context.services.notify('Card updated', 'success')
}

async function handleCardDelete(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const cardId = resolveValue(params.cardId, context) as string || context.editor.currentCardId
  if (!cardId) {
    throw new Error('No card selected')
  }

  // Check if other cards have choices pointing to this card (predecessors)
  // If so, deletion should be prevented to maintain graph integrity
  const choices = context.editor.choices as Array<{ targetCardId: string }>
  const predecessorCount = choices.filter(c => c.targetCardId === cardId).length
  if (predecessorCount > 0) {
    throw new Error(`Cannot delete: ${predecessorCount} card${predecessorCount > 1 ? 's' : ''} link to this card. Remove links first.`)
  }

  context.services.notify('Card deleted', 'success')
}

async function handleCardDuplicate(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<unknown> {
  const cardId = resolveValue(params.cardId, context) as string || context.editor.currentCardId
  if (!cardId) {
    throw new Error('No card selected')
  }

  context.services.notify('Card duplicated', 'success')
  return { id: `card-${Date.now()}`, originalId: cardId }
}

async function handleCardSelect(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const cardId = resolveValue(params.cardId, context) as string
  if (cardId) {
    context.services.notify(`Selected card: ${cardId}`, 'info')
  }
}

async function handleCharacterCreate(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<unknown> {
  const name = resolveValue(params.name || 'New Character', context) as string

  context.services.notify(`Created character: ${name}`, 'success')
  return { id: `char-${Date.now()}`, name }
}

async function handleCharacterUpdate(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const characterId = resolveValue(params.characterId, context) as string || context.editor.currentCharacterId
  if (!characterId) {
    throw new Error('No character selected')
  }

  context.services.notify('Character updated', 'success')
}

async function handleCharacterSelect(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const characterId = resolveValue(params.characterId, context) as string
  if (characterId) {
    context.services.notify(`Selected character: ${characterId}`, 'info')
  }
}

async function handleChoiceCreate(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<unknown> {
  const label = resolveValue(params.label || 'New Choice', context) as string

  context.services.notify(`Created choice: ${label}`, 'success')
  return { id: `choice-${Date.now()}`, label }
}

async function handleChoiceDelete(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const choiceId = resolveValue(params.choiceId, context) as string
  if (!choiceId) {
    throw new Error('No choice specified')
  }

  context.services.notify('Choice deleted', 'success')
}

async function handleAiComplete(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<string> {
  const prompt = resolveValue(params.prompt, context) as string
  const systemPrompt = resolveValue(params.systemPrompt, context) as string | undefined

  if (!prompt) {
    throw new Error('AI completion requires a prompt')
  }

  return await context.services.aiComplete(prompt, systemPrompt)
}

async function handleAiGenerateImage(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<string> {
  const prompt = resolveValue(params.prompt, context) as string

  if (!prompt) {
    throw new Error('Image generation requires a prompt')
  }

  return await context.services.aiGenerateImage(prompt)
}

async function handleAiGenerateChoices(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<string[]> {
  const content = resolveValue(params.content, context) as string ||
    (context.editor.currentCard as StoryCard | null)?.content

  if (!content) {
    throw new Error('No content available for generating choices')
  }

  const prompt = `Given this story content, suggest 3 compelling choices the reader could make:\n\n${content}\n\nProvide the choices as a JSON array of strings.`

  const result = await context.services.aiComplete(prompt)

  try {
    return JSON.parse(result)
  } catch {
    return [result]
  }
}

async function handleAiGenerateContent(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<string> {
  const topic = resolveValue(params.topic, context) as string
  const style = resolveValue(params.style, context) as string || 'engaging narrative'

  const prompt = `Write a short ${style} about: ${topic}`

  return await context.services.aiComplete(prompt)
}

async function handleExportJson(
  _params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const { editor } = context
  const exportData = {
    story: editor.storyStack,
    cards: editor.storyCards,
    characters: editor.characters,
    choices: editor.choices,
    exportedAt: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'story-export.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  context.services.notify('Story exported', 'success')
}

async function handleExportStory(
  _params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  // Same as handleExportJson for now
  await handleExportJson({}, context)
}

async function handleUiNotify(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const message = resolveValue(params.message, context) as string
  const type = (resolveValue(params.type, context) as string) || 'info'

  context.services.notify(message, type as 'info' | 'success' | 'warning' | 'error')
}

async function handleUiConfirm(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<boolean> {
  const message = resolveValue(params.message, context) as string
  return await context.services.confirm(message)
}

async function handleUiPrompt(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<string | null> {
  const message = resolveValue(params.message, context) as string
  const defaultValue = resolveValue(params.defaultValue, context) as string | undefined
  return await context.services.prompt(message, defaultValue)
}

async function handleViewToggle(
  params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  const view = resolveValue(params.view, context) as string
  context.services.notify(`Toggled view: ${view}`, 'info')
}

async function handlePublish(
  _params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  context.services.notify('Publishing story...', 'info')
  // Real implementation would call StoryService.publishStoryStack
}

async function handleUnpublish(
  _params: Record<string, ScriptValue>,
  context: ScriptExecutionContext
): Promise<void> {
  context.services.notify('Unpublishing story...', 'info')
  // Real implementation would call StoryService.unpublishStoryStack
}
