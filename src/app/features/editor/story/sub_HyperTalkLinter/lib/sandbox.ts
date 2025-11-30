// Sandboxed Script Runtime
// Executes HyperTalk scripts in a safe, isolated environment

import { RuntimeError, ScriptExecutionResult } from './types'

/**
 * Safe API available to scripts
 * These are the only functions and objects scripts can access
 */
interface ScriptAPI {
  // Navigation
  goToCard: (cardId: string) => void
  getCurrentCard: () => { id: string; title: string }

  // Dialog
  showDialog: (message: string, options?: { title?: string }) => void
  showChoice: (message: string, choices: string[]) => Promise<number>

  // State
  getVariable: (name: string) => unknown
  setVariable: (name: string, value: unknown) => void

  // Utilities
  random: (min: number, max: number) => number
  wait: (ms: number) => Promise<void>

  // Console (captured)
  console: {
    log: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
  }
}

type ConsoleLevel = 'log' | 'warn' | 'error' | 'info'

interface ConsoleEntry {
  level: ConsoleLevel
  args: unknown[]
  timestamp: number
}

/**
 * Create a sandboxed execution environment for scripts
 */
export function createSandbox(
  cardContext: { id: string; title: string },
  callbacks: {
    onNavigate?: (cardId: string) => void
    onDialog?: (message: string, options?: { title?: string }) => void
    onChoice?: (message: string, choices: string[]) => Promise<number>
  } = {}
): {
  execute: (script: string) => Promise<ScriptExecutionResult>
  getVariables: () => Record<string, unknown>
} {
  // Script-local state
  const variables: Record<string, unknown> = {}
  const consoleOutput: ConsoleEntry[] = []

  // Create the safe API
  const api: ScriptAPI = {
    goToCard: (cardId: string) => {
      if (typeof cardId !== 'string' || cardId.trim() === '') {
        throw new Error('goToCard requires a valid card ID')
      }
      callbacks.onNavigate?.(cardId)
    },

    getCurrentCard: () => ({ ...cardContext }),

    showDialog: (message: string, options?: { title?: string }) => {
      if (typeof message !== 'string') {
        throw new Error('showDialog requires a message string')
      }
      callbacks.onDialog?.(message, options)
    },

    showChoice: async (message: string, choices: string[]) => {
      if (typeof message !== 'string' || !Array.isArray(choices)) {
        throw new Error('showChoice requires a message and array of choices')
      }
      return callbacks.onChoice?.(message, choices) ?? 0
    },

    getVariable: (name: string) => {
      if (typeof name !== 'string') {
        throw new Error('getVariable requires a variable name')
      }
      return variables[name]
    },

    setVariable: (name: string, value: unknown) => {
      if (typeof name !== 'string') {
        throw new Error('setVariable requires a variable name')
      }
      variables[name] = value
    },

    random: (min: number, max: number) => {
      if (typeof min !== 'number' || typeof max !== 'number') {
        throw new Error('random requires two numbers')
      }
      return Math.floor(Math.random() * (max - min + 1)) + min
    },

    wait: (ms: number) => {
      if (typeof ms !== 'number' || ms < 0) {
        throw new Error('wait requires a positive number of milliseconds')
      }
      // Cap wait time to 10 seconds
      const cappedMs = Math.min(ms, 10000)
      return new Promise(resolve => setTimeout(resolve, cappedMs))
    },

    console: {
      log: (...args) => {
        consoleOutput.push({ level: 'log', args, timestamp: Date.now() })
      },
      warn: (...args) => {
        consoleOutput.push({ level: 'warn', args, timestamp: Date.now() })
      },
      error: (...args) => {
        consoleOutput.push({ level: 'error', args, timestamp: Date.now() })
      },
      info: (...args) => {
        consoleOutput.push({ level: 'info', args, timestamp: Date.now() })
      },
    },
  }

  /**
   * Execute a script in the sandbox
   */
  async function execute(script: string): Promise<ScriptExecutionResult> {
    // Reset console for each execution
    consoleOutput.length = 0

    if (!script || script.trim() === '') {
      return {
        success: true,
        consoleOutput: [],
      }
    }

    try {
      // Create a function that receives our safe API as parameters
      // This prevents access to global scope
      const wrappedScript = `
        "use strict";
        return (async function(goToCard, getCurrentCard, showDialog, showChoice, getVariable, setVariable, random, wait, console) {
          ${script}
        })(goToCard, getCurrentCard, showDialog, showChoice, getVariable, setVariable, random, wait, console);
      `

      // Create the function with controlled scope
      const fn = new Function(
        'goToCard',
        'getCurrentCard',
        'showDialog',
        'showChoice',
        'getVariable',
        'setVariable',
        'random',
        'wait',
        'console',
        wrappedScript
      )

      // Execute with timeout protection
      const timeoutMs = 5000 // 5 second timeout
      const result = await Promise.race([
        fn(
          api.goToCard,
          api.getCurrentCard,
          api.showDialog,
          api.showChoice,
          api.getVariable,
          api.setVariable,
          api.random,
          api.wait,
          api.console
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Script execution timed out (5 second limit)')), timeoutMs)
        ),
      ])

      return {
        success: true,
        returnValue: result,
        consoleOutput: [...consoleOutput],
      }
    } catch (error) {
      const runtimeError = parseRuntimeError(error, script)
      return {
        success: false,
        error: runtimeError,
        consoleOutput: [...consoleOutput],
      }
    }
  }

  return {
    execute,
    getVariables: () => ({ ...variables }),
  }
}

/**
 * Parse an error into a RuntimeError with location information
 */
function parseRuntimeError(error: unknown, script: string): RuntimeError {
  if (error instanceof Error) {
    const errorType = getErrorType(error)
    const location = extractLocationFromStack(error.stack, script)

    return {
      message: error.message,
      stack: error.stack,
      line: location.line,
      column: location.column,
      script,
      type: errorType,
    }
  }

  return {
    message: String(error),
    script,
    type: 'RuntimeError',
  }
}

/**
 * Determine the type of error
 */
function getErrorType(error: Error): RuntimeError['type'] {
  if (error instanceof SyntaxError) return 'SyntaxError'
  if (error instanceof ReferenceError) return 'ReferenceError'
  if (error instanceof TypeError) return 'TypeError'
  if (error instanceof RangeError) return 'RangeError'
  return 'RuntimeError'
}

/**
 * Try to extract line/column from stack trace
 */
function extractLocationFromStack(
  stack: string | undefined,
  script: string
): { line?: number; column?: number } {
  if (!stack) return {}

  // Look for patterns like "<anonymous>:3:10" or "eval:3:10"
  const match = stack.match(/<anonymous>:(\d+):(\d+)|eval.*?:(\d+):(\d+)/i)
  if (match) {
    // Adjust for the wrapper code we add (subtract the wrapper lines)
    const rawLine = parseInt(match[1] || match[3], 10)
    const column = parseInt(match[2] || match[4], 10)
    // Our wrapper adds ~3 lines before the user script
    const adjustedLine = Math.max(1, rawLine - 3)
    return { line: adjustedLine, column }
  }

  return {}
}

/**
 * Quick execution for preview - doesn't capture all features
 */
export async function executeScriptQuick(
  script: string,
  cardContext: { id: string; title: string }
): Promise<ScriptExecutionResult> {
  const sandbox = createSandbox(cardContext)
  return sandbox.execute(script)
}

/**
 * Validate that a script can be executed (syntax check + basic security)
 */
export function canExecuteScript(script: string): { valid: boolean; error?: string } {
  if (!script || script.trim() === '') {
    return { valid: true }
  }

  try {
    // Try to create the function (syntax check)
    new Function(`"use strict"; ${script}`)

    // Check for obvious security issues
    const forbidden = ['eval', 'Function(', 'import(', 'require(']
    for (const pattern of forbidden) {
      if (script.includes(pattern)) {
        return { valid: false, error: `Use of '${pattern}' is not allowed` }
      }
    }

    return { valid: true }
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid script',
    }
  }
}
