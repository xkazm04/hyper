'use client'

/**
 * Script State Context
 *
 * Unified state management for command scripts and Story DSL editing.
 * Combines previously separate ScriptContext and StoryDSLContext into
 * a single provider that exposes both execution state and DSL parsing state.
 *
 * This reduces the component tree complexity and makes state synchronization easier.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from 'react'
import { useEditor } from '@/contexts/EditorContext'
import type { Command } from '../../types'
import type {
  CommandScript,
  CommandScriptLibrary,
  ScriptExecutionContext,
  ScriptExecutionResult,
} from './types'
import { parseCommandScript, parseCommandLibrary, serializeCommandLibrary } from './parser'
import { compileScript, executeScript } from './engine'

const STORAGE_KEY = 'hypercard_command_scripts'

/**
 * Unified script state interface combining execution and DSL parsing state
 */
interface ScriptStateContextType {
  // === Script Execution State ===
  /** All loaded command scripts */
  scripts: CommandScript[]
  /** Scripts compiled into Command objects for the palette */
  compiledCommands: Command[]
  /** Add a new script */
  addScript: (script: CommandScript) => void
  /** Update an existing script */
  updateScript: (id: string, script: CommandScript) => void
  /** Remove a script */
  removeScript: (id: string) => void
  /** Import scripts from JSON */
  importScripts: (json: string) => { success: boolean; count: number; errors?: string[] }
  /** Export scripts as JSON library */
  exportScripts: (name?: string, description?: string) => string
  /** Execute a script by ID */
  executeScriptById: (id: string) => Promise<ScriptExecutionResult>
  /** Clear all scripts */
  clearScripts: () => void

  // === Script Editor State ===
  /** Is the script editor open */
  isScriptEditorOpen: boolean
  /** Open the script editor */
  openScriptEditor: () => void
  /** Close the script editor */
  closeScriptEditor: () => void
  /** Currently editing script */
  editingScript: CommandScript | null
  /** Set the script being edited */
  setEditingScript: (script: CommandScript | null) => void
  /** Create a new empty script for editing */
  createNewScript: () => void

  // === Story DSL Editor State ===
  /** Whether the DSL editor is open */
  isDslEditorOpen: boolean
  /** Open the DSL editor */
  openDslEditor: () => void
  /** Close the DSL editor */
  closeDslEditor: () => void
  /** Toggle the DSL editor */
  toggleDslEditor: () => void

  // === Legacy Aliases (for backward compatibility during migration) ===
  /** @deprecated Use isScriptEditorOpen instead */
  isEditorOpen: boolean
  /** @deprecated Use openScriptEditor instead */
  openEditor: () => void
  /** @deprecated Use closeScriptEditor instead */
  closeEditor: () => void
}

const ScriptStateContext = createContext<ScriptStateContextType | undefined>(undefined)

// Default example scripts
const DEFAULT_SCRIPTS: CommandScript[] = [
  {
    id: 'example-ai-title',
    label: 'Generate Card Title with AI',
    description: 'Use AI to generate a compelling title based on the card content',
    category: 'ai',
    icon: 'sparkles',
    actions: [
      {
        type: 'ai.complete',
        params: {
          prompt: { $expr: 'Generate a short, compelling title (5-8 words) for this story scene:\n\n${context.currentCard.content}' },
          systemPrompt: 'You are a creative writing assistant. Respond with only the title, no quotes or explanation.',
        },
        storeAs: 'generatedTitle',
      },
      {
        type: 'ui.notify',
        params: {
          message: { $expr: 'Generated title: ${var.generatedTitle}' },
          type: 'success',
        },
      },
    ],
    when: [
      {
        path: { $context: 'currentCard' },
        operator: 'exists',
      },
    ],
    metadata: {
      author: 'HyperCard Renaissance',
      version: '1.0.0',
      about: 'Example script showing AI integration',
    },
  },
  {
    id: 'example-export-json',
    label: 'Quick Export to JSON',
    description: 'Export the entire story with one click',
    category: 'export',
    icon: 'download',
    shortcut: 'Ctrl+Shift+E',
    actions: [
      {
        type: 'export.json',
      },
    ],
    metadata: {
      author: 'HyperCard Renaissance',
      version: '1.0.0',
    },
  },
  {
    id: 'example-card-summary',
    label: 'Generate Story Summary',
    description: 'Create an AI summary of the current card',
    category: 'ai',
    icon: 'bot',
    actions: [
      {
        type: 'ui.confirm',
        params: {
          message: 'Generate an AI summary of the current card?',
        },
        storeAs: 'confirmed',
      },
      {
        type: 'ai.complete',
        params: {
          prompt: { $expr: 'Summarize this story scene in 2-3 sentences:\n\n${context.currentCard.content}' },
        },
        storeAs: 'summary',
        if: {
          path: 'confirmed',
          operator: 'equals',
          value: true,
        },
      },
      {
        type: 'ui.notify',
        params: {
          message: { $var: 'summary' },
          type: 'info',
        },
        if: {
          path: 'summary',
          operator: 'exists',
        },
      },
    ],
    when: [
      {
        path: { $context: 'currentCard.content' },
        operator: 'exists',
      },
    ],
    metadata: {
      author: 'HyperCard Renaissance',
      version: '1.0.0',
    },
  },
]

interface ScriptStateProviderProps {
  children: ReactNode
}

export function ScriptStateProvider({ children }: ScriptStateProviderProps) {
  // === Script Execution State ===
  const [scripts, setScripts] = useState<CommandScript[]>([])
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<CommandScript | null>(null)

  // === Story DSL Editor State ===
  const [isDslEditorOpen, setIsDslEditorOpen] = useState(false)

  const editor = useEditor()

  // Load scripts from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Validate each script
          const validScripts: CommandScript[] = []
          for (const script of parsed) {
            const result = parseCommandScript(script)
            if (result.success && result.script) {
              validScripts.push(result.script)
            }
          }
          setScripts(validScripts)
        }
      } else {
        // First time - load default example scripts
        setScripts(DEFAULT_SCRIPTS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCRIPTS))
      }
    } catch (e) {
      console.error('Failed to load command scripts:', e)
      setScripts(DEFAULT_SCRIPTS)
    }
  }, [])

  // Save scripts to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (scripts.length === 0) return // Don't save empty state on initial mount

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts))
    } catch (e) {
      console.error('Failed to save command scripts:', e)
    }
  }, [scripts])

  // Create execution context
  const createExecutionContext = useCallback((): ScriptExecutionContext => {
    return {
      variables: new Map(),
      editor: {
        storyStack: editor.storyStack,
        storyCards: editor.storyCards,
        currentCard: editor.currentCard,
        currentCardId: editor.currentCardId,
        choices: editor.choices,
        characters: editor.characters,
        currentCharacter: editor.currentCharacter,
        currentCharacterId: editor.currentCharacterId,
      },
      services: {
        aiComplete: async (prompt: string, systemPrompt?: string) => {
          const response = await fetch('/api/ai/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemPrompt }),
          })
          if (!response.ok) {
            throw new Error('AI completion failed')
          }
          const data = await response.json()
          return data.completion
        },
        aiGenerateImage: async (prompt: string) => {
          const response = await fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          })
          if (!response.ok) {
            throw new Error('Image generation failed')
          }
          const data = await response.json()
          return data.imageUrl
        },
        notify: (message: string, type = 'info') => {
          // Simple notification using alert for now
          // Could be replaced with a toast system
          if (type === 'error') {
            console.error(message)
          } else {
            console.log(`[${type}]`, message)
          }
          // Show as alert for visibility
          if (typeof window !== 'undefined') {
            // Use a non-blocking notification
            const notificationDiv = document.createElement('div')
            notificationDiv.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-4 ${
              type === 'error' ? 'bg-destructive text-destructive-foreground' :
              type === 'warning' ? 'bg-yellow-500 text-white' :
              type === 'success' ? 'bg-green-500 text-white' :
              'bg-card text-card-foreground border border-border'
            }`
            notificationDiv.textContent = message
            document.body.appendChild(notificationDiv)
            setTimeout(() => {
              notificationDiv.classList.add('animate-out', 'fade-out')
              setTimeout(() => {
                document.body.removeChild(notificationDiv)
              }, 200)
            }, 3000)
          }
        },
        confirm: async (message: string) => {
          return window.confirm(message)
        },
        prompt: async (message: string, defaultValue?: string) => {
          return window.prompt(message, defaultValue)
        },
      },
    }
  }, [editor])

  // Compile scripts into Command objects
  const compiledCommands = useMemo(() => {
    const context = createExecutionContext()

    return scripts.map((script) =>
      compileScript(script, context, async (s, ctx) => executeScript(s, ctx))
    )
  }, [scripts, createExecutionContext])

  const addScript = useCallback((script: CommandScript) => {
    // Validate the script
    const result = parseCommandScript(script)
    if (!result.success) {
      console.error('Invalid script:', result.errors)
      return
    }

    setScripts((prev) => {
      // Check for duplicate ID
      const exists = prev.some((s) => s.id === script.id)
      if (exists) {
        // Update existing
        return prev.map((s) => (s.id === script.id ? script : s))
      }
      return [...prev, script]
    })
  }, [])

  const updateScript = useCallback((id: string, script: CommandScript) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === id ? { ...script, id } : s))
    )
  }, [])

  const removeScript = useCallback((id: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const importScripts = useCallback(
    (json: string): { success: boolean; count: number; errors?: string[] } => {
      const result = parseCommandLibrary(json)

      if (!result.success || !result.scripts) {
        return {
          success: false,
          count: 0,
          errors: result.errors?.map((e) => e.message) || ['Failed to parse scripts'],
        }
      }

      // Add all valid scripts
      setScripts((prev) => {
        const newScripts = [...prev]
        for (const script of result.scripts!) {
          const existingIndex = newScripts.findIndex((s) => s.id === script.id)
          if (existingIndex >= 0) {
            newScripts[existingIndex] = script
          } else {
            newScripts.push(script)
          }
        }
        return newScripts
      })

      return {
        success: true,
        count: result.scripts.length,
        errors: result.warnings?.map((w) => w.message),
      }
    },
    []
  )

  const exportScripts = useCallback(
    (name?: string, description?: string): string => {
      return serializeCommandLibrary(scripts, { name, description })
    },
    [scripts]
  )

  const executeScriptById = useCallback(
    async (id: string): Promise<ScriptExecutionResult> => {
      const script = scripts.find((s) => s.id === id)
      if (!script) {
        return { success: false, error: `Script not found: ${id}` }
      }

      const context = createExecutionContext()
      return executeScript(script, context)
    },
    [scripts, createExecutionContext]
  )

  const clearScripts = useCallback(() => {
    setScripts([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // === Script Editor Actions ===
  const openScriptEditor = useCallback(() => {
    setIsScriptEditorOpen(true)
  }, [])

  const closeScriptEditor = useCallback(() => {
    setIsScriptEditorOpen(false)
    setEditingScript(null)
  }, [])

  const createNewScript = useCallback(() => {
    const newScript: CommandScript = {
      id: `custom-${Date.now()}`,
      label: 'New Command',
      description: 'A custom command',
      category: 'custom',
      icon: 'wand',
      actions: [
        {
          type: 'ui.notify',
          params: {
            message: 'Hello from custom command!',
            type: 'info',
          },
        },
      ],
      metadata: {
        author: '',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
      },
    }
    setEditingScript(newScript)
    setIsScriptEditorOpen(true)
  }, [])

  // === Story DSL Editor Actions ===
  const openDslEditor = useCallback(() => {
    setIsDslEditorOpen(true)
  }, [])

  const closeDslEditor = useCallback(() => {
    setIsDslEditorOpen(false)
  }, [])

  const toggleDslEditor = useCallback(() => {
    setIsDslEditorOpen(prev => !prev)
  }, [])

  return (
    <ScriptStateContext.Provider
      value={{
        // Script execution state
        scripts,
        compiledCommands,
        addScript,
        updateScript,
        removeScript,
        importScripts,
        exportScripts,
        executeScriptById,
        clearScripts,

        // Script editor state
        isScriptEditorOpen,
        openScriptEditor,
        closeScriptEditor,
        editingScript,
        setEditingScript,
        createNewScript,

        // Story DSL editor state
        isDslEditorOpen,
        openDslEditor,
        closeDslEditor,
        toggleDslEditor,

        // Legacy aliases (for backward compatibility)
        isEditorOpen: isScriptEditorOpen,
        openEditor: openScriptEditor,
        closeEditor: closeScriptEditor,
      }}
    >
      {children}
    </ScriptStateContext.Provider>
  )
}

/**
 * Hook to access unified script state
 */
export function useScriptState() {
  const context = useContext(ScriptStateContext)
  if (context === undefined) {
    throw new Error('useScriptState must be used within a ScriptStateProvider')
  }
  return context
}

/**
 * @deprecated Use useScriptState instead. This hook is provided for backward compatibility.
 */
export function useScripts() {
  return useScriptState()
}

/**
 * @deprecated Use useScriptState instead. This hook is provided for backward compatibility.
 */
export function useStoryDSL() {
  const context = useScriptState()
  return {
    isEditorOpen: context.isDslEditorOpen,
    openEditor: context.openDslEditor,
    closeEditor: context.closeDslEditor,
    toggleEditor: context.toggleDslEditor,
  }
}

/**
 * @deprecated Use ScriptStateProvider instead. Alias for backward compatibility.
 */
export const ScriptProvider = ScriptStateProvider

/**
 * @deprecated Use ScriptStateProvider instead. Alias for backward compatibility.
 */
export const StoryDSLProvider = ({ children }: { children: ReactNode }) => <>{children}</>
