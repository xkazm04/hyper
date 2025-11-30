// HyperTalk Linter Types

export type LintSeverity = 'error' | 'warning' | 'info'

export interface LintError {
  /** Unique identifier for the error type */
  code: string
  /** Error message to display */
  message: string
  /** Severity level */
  severity: LintSeverity
  /** Line number (1-indexed) */
  line: number
  /** Column number (1-indexed) */
  column: number
  /** End line (for multi-line errors) */
  endLine?: number
  /** End column */
  endColumn?: number
  /** Optional suggestion for fixing */
  suggestion?: string
}

export interface LintResult {
  /** Whether the script is valid (no errors, warnings allowed) */
  isValid: boolean
  /** List of lint errors/warnings */
  errors: LintError[]
  /** Quick summary for display */
  summary: {
    errorCount: number
    warningCount: number
    infoCount: number
  }
}

export interface RuntimeError {
  /** Error message */
  message: string
  /** Stack trace if available */
  stack?: string
  /** Line number where error occurred (if determinable) */
  line?: number
  /** Column number */
  column?: number
  /** The script that caused the error */
  script: string
  /** Type of error */
  type: 'SyntaxError' | 'ReferenceError' | 'TypeError' | 'RangeError' | 'RuntimeError'
}

export interface ScriptExecutionResult {
  /** Whether execution was successful */
  success: boolean
  /** Return value if any */
  returnValue?: unknown
  /** Error if execution failed */
  error?: RuntimeError
  /** Console output captured during execution */
  consoleOutput: Array<{
    level: 'log' | 'warn' | 'error' | 'info'
    args: unknown[]
    timestamp: number
  }>
}

// HyperTalk language keywords and built-ins
export const HYPERTALK_KEYWORDS = [
  // Control flow
  'if', 'then', 'else', 'end', 'repeat', 'while', 'until', 'for', 'next', 'exit',
  // Functions
  'function', 'on', 'return',
  // Navigation
  'go', 'to', 'card', 'stack', 'next', 'prev', 'first', 'last',
  // Variables
  'put', 'into', 'get', 'set', 'global', 'local',
  // Messages
  'send', 'message', 'answer', 'ask',
  // Visual
  'show', 'hide', 'visual', 'effect',
  // Properties
  'the', 'of', 'me', 'it',
] as const

// Built-in functions available in scripts
export const HYPERTALK_BUILTINS = [
  // Math
  'abs', 'round', 'trunc', 'random', 'sqrt', 'sin', 'cos', 'tan', 'atan', 'exp', 'ln', 'log2',
  // String
  'length', 'offset', 'charToNum', 'numToChar', 'toUpper', 'toLower',
  // Date/Time
  'date', 'time', 'ticks', 'seconds',
  // Utility
  'sound', 'beep', 'wait', 'choose',
] as const

// Pattern for detecting common script issues
export const DANGEROUS_PATTERNS = [
  { pattern: /\beval\s*\(/g, message: 'Use of eval() is not allowed for security reasons', code: 'no-eval' },
  { pattern: /\bFunction\s*\(/g, message: 'Dynamic function creation is not allowed', code: 'no-function-constructor' },
  { pattern: /\bimport\s*\(/g, message: 'Dynamic imports are not allowed', code: 'no-dynamic-import' },
  { pattern: /\bfetch\s*\(/g, message: 'Network requests are not allowed in scripts', code: 'no-fetch' },
  { pattern: /\bXMLHttpRequest\b/g, message: 'Network requests are not allowed', code: 'no-xhr' },
  { pattern: /\bdocument\s*\./g, message: 'Direct DOM manipulation is not allowed', code: 'no-document' },
  { pattern: /\bwindow\s*\./g, message: 'Direct window access is not allowed', code: 'no-window' },
  { pattern: /\blocalStorage\b/g, message: 'localStorage is not available in scripts', code: 'no-localstorage' },
  { pattern: /\bsessionStorage\b/g, message: 'sessionStorage is not available in scripts', code: 'no-sessionstorage' },
] as const
