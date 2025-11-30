// HyperTalk Linter and Sandbox Library
// Provides script validation and safe execution

export { lintScript, isValidSyntax, getErrorsForLine, formatLintResult } from './linter'
export { createSandbox, executeScriptQuick, canExecuteScript } from './sandbox'
export type {
  LintError,
  LintResult,
  LintSeverity,
  RuntimeError,
  ScriptExecutionResult,
} from './types'
export { HYPERTALK_KEYWORDS, HYPERTALK_BUILTINS, DANGEROUS_PATTERNS } from './types'
