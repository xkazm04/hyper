// HyperTalk Script Linter
// Validates script syntax and checks for common issues

import {
  LintError,
  LintResult,
  LintSeverity,
  DANGEROUS_PATTERNS
} from './types'

interface TokenInfo {
  line: number
  column: number
  value: string
}

/**
 * Lint a HyperTalk/JavaScript script for syntax errors and potential issues
 */
export function lintScript(script: string): LintResult {
  const errors: LintError[] = []

  if (!script || script.trim() === '') {
    return {
      isValid: true,
      errors: [],
      summary: { errorCount: 0, warningCount: 0, infoCount: 0 }
    }
  }

  // 1. Check for JavaScript syntax errors
  const syntaxErrors = checkSyntax(script)
  errors.push(...syntaxErrors)

  // 2. Check for dangerous patterns (security)
  const securityErrors = checkSecurityPatterns(script)
  errors.push(...securityErrors)

  // 3. Check for common mistakes
  const commonErrors = checkCommonMistakes(script)
  errors.push(...commonErrors)

  // 4. Check for HyperTalk-specific issues
  const hypertalkWarnings = checkHyperTalkPatterns(script)
  errors.push(...hypertalkWarnings)

  // Calculate summary
  const summary = {
    errorCount: errors.filter(e => e.severity === 'error').length,
    warningCount: errors.filter(e => e.severity === 'warning').length,
    infoCount: errors.filter(e => e.severity === 'info').length,
  }

  return {
    isValid: summary.errorCount === 0,
    errors: errors.sort((a, b) => a.line - b.line || a.column - b.column),
    summary
  }
}

/**
 * Check for JavaScript syntax errors using the native parser
 */
function checkSyntax(script: string): LintError[] {
  const errors: LintError[] = []

  try {
    // Try to parse as a function body
    new Function(script)
  } catch (e) {
    if (e instanceof SyntaxError) {
      const { line, column } = extractErrorLocation(e.message, script)
      errors.push({
        code: 'syntax-error',
        message: cleanSyntaxErrorMessage(e.message),
        severity: 'error',
        line,
        column,
        suggestion: getSyntaxSuggestion(e.message)
      })
    }
  }

  return errors
}

/**
 * Extract line and column from error message or estimate from script
 */
function extractErrorLocation(message: string, script: string): { line: number; column: number } {
  // Try to extract from message patterns like "line X" or "at position X"
  const lineMatch = message.match(/line\s+(\d+)/i)
  const posMatch = message.match(/position\s+(\d+)/i)

  if (lineMatch) {
    return { line: parseInt(lineMatch[1], 10), column: 1 }
  }

  if (posMatch) {
    const position = parseInt(posMatch[1], 10)
    return positionToLineColumn(script, position)
  }

  // Try to find the error location by looking for common problem patterns
  const lines = script.split('\n')

  // Check for unclosed brackets
  let braceCount = 0
  let bracketCount = 0
  let parenCount = 0
  let lastOpenLine = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (let j = 0; j < line.length; j++) {
      switch (line[j]) {
        case '{': braceCount++; lastOpenLine = i + 1; break
        case '}': braceCount--; break
        case '[': bracketCount++; lastOpenLine = i + 1; break
        case ']': bracketCount--; break
        case '(': parenCount++; lastOpenLine = i + 1; break
        case ')': parenCount--; break
      }

      if (braceCount < 0 || bracketCount < 0 || parenCount < 0) {
        return { line: i + 1, column: j + 1 }
      }
    }
  }

  if (braceCount > 0 || bracketCount > 0 || parenCount > 0) {
    return { line: lastOpenLine, column: 1 }
  }

  return { line: 1, column: 1 }
}

/**
 * Convert character position to line and column
 */
function positionToLineColumn(script: string, position: number): { line: number; column: number } {
  let line = 1
  let column = 1

  for (let i = 0; i < Math.min(position, script.length); i++) {
    if (script[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }

  return { line, column }
}

/**
 * Clean up syntax error messages for display
 */
function cleanSyntaxErrorMessage(message: string): string {
  // Remove internal V8/SpiderMonkey prefixes
  return message
    .replace(/^SyntaxError:\s*/i, '')
    .replace(/\s*\(.*?\)$/, '')
    .trim()
}

/**
 * Get a helpful suggestion for common syntax errors
 */
function getSyntaxSuggestion(message: string): string | undefined {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('unexpected token')) {
    if (lowerMessage.includes('}')) {
      return 'Check for missing opening brace or extra closing brace'
    }
    if (lowerMessage.includes(')')) {
      return 'Check for missing opening parenthesis or extra closing parenthesis'
    }
    return 'Check for typos or missing punctuation'
  }

  if (lowerMessage.includes('unexpected end')) {
    return 'You may be missing a closing brace, bracket, or quote'
  }

  if (lowerMessage.includes('missing') && lowerMessage.includes('after')) {
    return 'Add the missing character mentioned in the error'
  }

  if (lowerMessage.includes('unterminated string')) {
    return 'Close the string with a matching quote character'
  }

  return undefined
}

/**
 * Check for security-sensitive patterns that are not allowed
 */
function checkSecurityPatterns(script: string): LintError[] {
  const errors: LintError[] = []
  const lines = script.split('\n')

  for (const { pattern, message, code } of DANGEROUS_PATTERNS) {
    // Reset pattern for each script
    pattern.lastIndex = 0

    let match
    while ((match = pattern.exec(script)) !== null) {
      const { line, column } = positionToLineColumn(script, match.index)
      errors.push({
        code,
        message,
        severity: 'error',
        line,
        column,
        endColumn: column + match[0].length,
        suggestion: 'Use the provided HyperTalk API instead'
      })
    }
  }

  return errors
}

/**
 * Check for common coding mistakes
 */
function checkCommonMistakes(script: string): LintError[] {
  const errors: LintError[] = []
  const lines = script.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1
    const trimmedLine = line.trim()

    // Check for assignment in condition (common mistake)
    const assignInCondition = /\bif\s*\([^)]*[^!=<>]=(?!=)[^)]*\)/.exec(line)
    if (assignInCondition && !line.includes('===') && !line.includes('!==')) {
      errors.push({
        code: 'assignment-in-condition',
        message: 'Possible assignment in condition instead of comparison',
        severity: 'warning',
        line: lineNum,
        column: line.indexOf('=') + 1,
        suggestion: 'Use === for comparison instead of ='
      })
    }

    // Check for empty statement (single semicolon)
    if (trimmedLine === ';') {
      errors.push({
        code: 'empty-statement',
        message: 'Empty statement',
        severity: 'info',
        line: lineNum,
        column: line.indexOf(';') + 1,
        suggestion: 'Remove the empty statement or add the intended code'
      })
    }

    // Check for console.log (might be intentional but good to flag)
    const consoleMatch = /\bconsole\.(log|warn|error|info)\s*\(/.exec(line)
    if (consoleMatch) {
      errors.push({
        code: 'console-statement',
        message: 'Console statement found - will appear in debug output',
        severity: 'info',
        line: lineNum,
        column: line.indexOf(consoleMatch[0]) + 1,
      })
    }

    // Check for undeclared variable assignment
    const globalAssignment = /^(\w+)\s*=(?!=)/.exec(trimmedLine)
    if (globalAssignment && !['let', 'const', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return'].includes(globalAssignment[1])) {
      // Check if it looks like an implicit global
      const varName = globalAssignment[1]
      const isBuiltin = ['true', 'false', 'null', 'undefined', 'this'].includes(varName)
      const isDeclaredBefore = new RegExp(`\\b(let|const|var)\\s+${varName}\\b`).test(script.substring(0, script.indexOf(line)))
      const isParameter = /^\s*function\s+\w*\s*\([^)]*\b/.test(script)

      if (!isBuiltin && !isDeclaredBefore) {
        errors.push({
          code: 'implicit-global',
          message: `'${varName}' is assigned without declaration`,
          severity: 'warning',
          line: lineNum,
          column: 1,
          suggestion: `Add 'let ${varName} =' or 'const ${varName} =' to declare the variable`
        })
      }
    }

    // Check for duplicate variable declarations
    const varDeclaration = /\b(let|const|var)\s+(\w+)/.exec(line)
    if (varDeclaration) {
      const varName = varDeclaration[2]
      const beforeThis = lines.slice(0, index).join('\n')
      if (new RegExp(`\\b(let|const|var)\\s+${varName}\\b`).test(beforeThis)) {
        errors.push({
          code: 'duplicate-declaration',
          message: `'${varName}' is already declared`,
          severity: 'error',
          line: lineNum,
          column: line.indexOf(varName) + 1,
          suggestion: 'Use a different variable name or remove the duplicate declaration'
        })
      }
    }
  })

  return errors
}

/**
 * Check for HyperTalk-specific patterns and provide guidance
 */
function checkHyperTalkPatterns(script: string): LintError[] {
  const errors: LintError[] = []
  const lines = script.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Check for HyperTalk-style "put X into Y" - suggest JS equivalent
    const putInto = /\bput\s+(.+?)\s+into\s+(\w+)/i.exec(line)
    if (putInto) {
      errors.push({
        code: 'hypertalk-put',
        message: 'HyperTalk "put into" syntax detected',
        severity: 'info',
        line: lineNum,
        column: line.indexOf('put') + 1,
        suggestion: `Use: let ${putInto[2]} = ${putInto[1]}`
      })
    }

    // Check for "go to card X" - suggest using goToCard()
    const goToCard = /\bgo\s+to\s+card\s+["']?(\w+)["']?/i.exec(line)
    if (goToCard) {
      errors.push({
        code: 'hypertalk-goto',
        message: 'HyperTalk "go to card" syntax detected',
        severity: 'info',
        line: lineNum,
        column: line.indexOf('go') + 1,
        suggestion: `Use: goToCard('${goToCard[1]}')`
      })
    }

    // Check for answer/ask dialogs
    const answer = /\banswer\s+["'](.+?)["']/i.exec(line)
    if (answer) {
      errors.push({
        code: 'hypertalk-answer',
        message: 'HyperTalk "answer" dialog syntax detected',
        severity: 'info',
        line: lineNum,
        column: line.indexOf('answer') + 1,
        suggestion: `Use: showDialog('${answer[1]}')`
      })
    }
  })

  return errors
}

/**
 * Quick syntax check - returns true if valid, false otherwise
 * Useful for quick validation before auto-save
 */
export function isValidSyntax(script: string): boolean {
  if (!script || script.trim() === '') {
    return true
  }

  try {
    new Function(script)
    return true
  } catch {
    return false
  }
}

/**
 * Get lint errors for a specific line
 */
export function getErrorsForLine(result: LintResult, line: number): LintError[] {
  return result.errors.filter(e => e.line === line)
}

/**
 * Format lint result for display
 */
export function formatLintResult(result: LintResult): string {
  if (result.isValid && result.errors.length === 0) {
    return 'No issues found'
  }

  const parts: string[] = []

  if (result.summary.errorCount > 0) {
    parts.push(`${result.summary.errorCount} error${result.summary.errorCount > 1 ? 's' : ''}`)
  }
  if (result.summary.warningCount > 0) {
    parts.push(`${result.summary.warningCount} warning${result.summary.warningCount > 1 ? 's' : ''}`)
  }
  if (result.summary.infoCount > 0) {
    parts.push(`${result.summary.infoCount} info`)
  }

  return parts.join(', ')
}
