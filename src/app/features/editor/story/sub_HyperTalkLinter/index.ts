// HyperTalk Script Linting and Runtime Module
// Provides syntax validation, security checks, and sandboxed execution

// Components
export {
  ScriptEditor,
  LintErrorList,
  LintStatusBadge,
  RuntimeErrorOverlay,
  RuntimeErrorBoundary,
  PreviewWithScriptRunner,
  usePreviewScript,
} from './components'

// Hooks
export { useLinter, useValidateBeforeSave, useScriptRunner } from './hooks'

// Core library
export {
  lintScript,
  isValidSyntax,
  getErrorsForLine,
  formatLintResult,
  createSandbox,
  executeScriptQuick,
  canExecuteScript,
} from './lib'

// Types
export type {
  LintError,
  LintResult,
  LintSeverity,
  RuntimeError,
  ScriptExecutionResult,
} from './lib'
