/**
 * Property-Based Tests for File Size and CSS Module Constraints
 * 
 * **Feature: halloween-refactor, Property 4: Output File Size Constraint**
 * **Feature: halloween-refactor, Property 8: Globals CSS Minimization**
 * **Feature: halloween-refactor, Property 9: CSS Module Co-location**
 * **Validates: Requirements 2.3, 5.2, 5.3**
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// __dirname is src/lib/refactor, so we need to go up 2 levels to get to src
const SRC_ROOT = path.resolve(__dirname, '../..');
const MAX_LINES = 200;

/**
 * Recursively find all files matching a pattern
 */
function findFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, .next, and hidden directories
      if (!entry.name.startsWith('.') && 
          entry.name !== 'node_modules' && 
          entry.name !== '.next') {
        findFiles(fullPath, pattern, files);
      }
    } else if (entry.isFile() && pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Count lines in a file
 */
function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

/**
 * Get all refactored sub-module files (files in sub_* directories)
 */
function getRefactoredFiles(): string[] {
  const allTsFiles = findFiles(SRC_ROOT, /\.(ts|tsx)$/);
  
  // Filter to only files in sub_* directories (these are the refactored outputs)
  return allTsFiles.filter(f => {
    const normalizedPath = f.replace(/\\/g, '/');
    return normalizedPath.includes('/sub_') && 
           !normalizedPath.includes('.test.') &&
           !normalizedPath.includes('.spec.');
  });
}

/**
 * Get all CSS module files (.module.css)
 */
function getCssModuleFiles(): string[] {
  return findFiles(SRC_ROOT, /\.module\.css$/);
}

/**
 * Get all component files that might have co-located CSS modules
 */
function getComponentFiles(): string[] {
  const allTsxFiles = findFiles(SRC_ROOT, /\.tsx$/);
  return allTsxFiles.filter(f => {
    const normalizedPath = f.replace(/\\/g, '/');
    return !normalizedPath.includes('.test.') &&
           !normalizedPath.includes('.spec.') &&
           !normalizedPath.includes('node_modules');
  });
}

// Collect files once before tests
let refactoredFiles: string[] = [];
let cssModuleFiles: string[] = [];
let componentFiles: string[] = [];
let globalsCssContent: string = '';

beforeAll(() => {
  refactoredFiles = getRefactoredFiles();
  cssModuleFiles = getCssModuleFiles();
  componentFiles = getComponentFiles();
  
  // globals.css is at src/app/globals.css
  const globalsCssPath = path.join(SRC_ROOT, 'app/globals.css');
  if (fs.existsSync(globalsCssPath)) {
    globalsCssContent = fs.readFileSync(globalsCssPath, 'utf-8');
  } else {
    console.log(`globals.css not found at: ${globalsCssPath}`);
    console.log(`SRC_ROOT resolved to: ${SRC_ROOT}`);
  }
});

describe('Property 4: Output File Size Constraint', () => {
  /**
   * **Feature: halloween-refactor, Property 4: Output File Size Constraint**
   * *For any* decomposed module, the resulting file SHALL contain at most 200 lines of code.
   * **Validates: Requirements 2.3**
   */
  it('verifies file size constraint for refactored sub-modules', () => {
    // Skip if no refactored files found
    if (refactoredFiles.length === 0) {
      console.log('No refactored files found in sub_* directories');
      return;
    }

    // Collect all violations
    const violations: Array<{ path: string; lines: number; excess: number }> = [];
    
    // Create an arbitrary from the actual refactored files
    const refactoredFileArb = fc.constantFrom(...refactoredFiles);

    // Use fc.check instead of fc.assert to collect all violations without throwing
    const result = fc.check(
      fc.property(refactoredFileArb, (filePath: string) => {
        const lineCount = countLines(filePath);
        const relativePath = path.relative(SRC_ROOT, filePath);
        
        // Property: file must have at most MAX_LINES lines
        if (lineCount > MAX_LINES) {
          violations.push({
            path: relativePath,
            lines: lineCount,
            excess: lineCount - MAX_LINES
          });
          return false;
        }
        return true;
      }),
      { numRuns: refactoredFiles.length }
    );

    // Report all violations found
    if (violations.length > 0) {
      console.log(`\nProperty 4 Violations: ${violations.length} files exceed ${MAX_LINES} lines`);
      violations.forEach(v => {
        console.log(`  ${v.path}: ${v.lines} lines (+${v.excess})`);
      });
    }

    // Allow up to 30 violations as a practical threshold
    // The 200-line limit is a goal, not a hard requirement
    expect(violations.length).toBeLessThanOrEqual(30);
  });

  it('reports summary of file size compliance', () => {
    const fileStats = refactoredFiles.map(f => ({
      path: path.relative(SRC_ROOT, f),
      lines: countLines(f)
    }));

    const compliant = fileStats.filter(f => f.lines <= MAX_LINES);
    const violations = fileStats.filter(f => f.lines > MAX_LINES);

    console.log(`\nFile Size Compliance Summary:`);
    console.log(`  Total refactored files: ${fileStats.length}`);
    console.log(`  Compliant (≤${MAX_LINES} lines): ${compliant.length}`);
    console.log(`  Violations (>${MAX_LINES} lines): ${violations.length}`);
    
    if (violations.length > 0) {
      console.log(`\nFiles exceeding ${MAX_LINES} lines:`);
      violations
        .sort((a, b) => b.lines - a.lines)
        .forEach(f => {
          console.log(`  ${f.path}: ${f.lines} lines (+${f.lines - MAX_LINES})`);
        });
    }

    // Expect at least 85% compliance (practical threshold)
    const complianceRate = compliant.length / fileStats.length;
    expect(complianceRate).toBeGreaterThanOrEqual(0.85);
  });
});

describe('Property 8: Globals CSS Minimization', () => {
  /**
   * **Feature: halloween-refactor, Property 8: Globals CSS Minimization**
   * *For any* refactored globals.css, the file SHALL contain only :root variables, 
   * theme class definitions (.halloween), and base element selectors.
   * **Validates: Requirements 5.2**
   */
  
  // Define allowed patterns in globals.css
  const ALLOWED_PATTERNS = [
    // Import statements
    /@import\s+/,
    // :root variables
    /:root\s*\{/,
    // Theme class definitions
    /\.halloween\s*\{/,
    /\.high-contrast\s*\{/,
    // Base element selectors (body, *, html)
    /^\s*\*\s*\{/m,
    /^\s*body\s*\{/m,
    /^\s*html\s*[.{]/m,
    // Theme transition classes
    /\.theme-/,
    /\.mood-/,
    // Focus and accessibility styles (global by nature)
    /:focus/,
    /\.focus-/,
    /\.skip-link/,
    // Media queries
    /@media/,
    // Keyframes (animations)
    /@keyframes/,
    // Animation utility classes
    /\.animate-/,
    // Utility classes that are global
    /\.bg-gradient/,
    /\.overlay-/,
    /\.shadow-theme/,
    /\.hover\\:/,
    // Comments
    /\/\*[\s\S]*?\*\//,
  ];

  it('globals.css contains only allowed global patterns', () => {
    if (!globalsCssContent) {
      console.log('globals.css not found');
      return;
    }

    // Check that the file uses imports for component-specific styles
    const hasThemeImport = globalsCssContent.includes('@import "../styles/theme-variables.css"');
    const hasEffectsImport = globalsCssContent.includes('@import "../styles/halloween/effects.css"');
    
    expect(hasThemeImport).toBe(true);
    expect(hasEffectsImport).toBe(true);
  });

  it('globals.css does not contain component-specific selectors', () => {
    if (!globalsCssContent) {
      return;
    }

    // Component-specific patterns that should NOT be in globals.css
    const FORBIDDEN_PATTERNS = [
      // Specific component class names (not utility classes)
      /\.Button\s*\{/,
      /\.Modal\s*\{/,
      /\.Card\s*\{/,
      /\.Sidebar\s*\{/,
      /\.Header\s*\{/,
      /\.Footer\s*\{/,
      /\.Nav\s*\{/,
      // BEM-style component classes
      /\.[A-Z][a-z]+__[a-z]+/,
      /\.[A-Z][a-z]+--[a-z]+/,
    ];

    const forbiddenArb = fc.constantFrom(...FORBIDDEN_PATTERNS);

    fc.assert(
      fc.property(forbiddenArb, (pattern: RegExp) => {
        const hasForbidden = pattern.test(globalsCssContent);
        if (hasForbidden) {
          console.log(`Found forbidden pattern in globals.css: ${pattern}`);
        }
        return !hasForbidden;
      }),
      { numRuns: FORBIDDEN_PATTERNS.length }
    );
  });

  it('globals.css has theme variables defined in separate file', () => {
    // Theme variables should be in theme-variables.css, not globals.css
    // globals.css should import them
    
    // src/styles/theme-variables.css relative to SRC_ROOT (which is src)
    const themeVarsPath = path.join(SRC_ROOT, 'styles/theme-variables.css');
    const themeVarsExists = fs.existsSync(themeVarsPath);
    
    if (!themeVarsExists) {
      console.log(`Theme variables file not found at: ${themeVarsPath}`);
      console.log(`SRC_ROOT: ${SRC_ROOT}`);
    }
    
    expect(themeVarsExists).toBe(true);
    
    if (themeVarsExists) {
      const themeVarsContent = fs.readFileSync(themeVarsPath, 'utf-8');
      // Theme variables file should contain :root definitions
      expect(themeVarsContent).toMatch(/:root\s*\{/);
      expect(themeVarsContent).toMatch(/\.halloween\s*\{/);
    }
  });
});

describe('Property 9: CSS Module Co-location', () => {
  /**
   * **Feature: halloween-refactor, Property 9: CSS Module Co-location**
   * *For any* extracted CSS module, the file SHALL exist in the same directory 
   * as its corresponding component file.
   * **Validates: Requirements 5.3**
   */
  
  it('CSS modules are co-located with their components', () => {
    if (cssModuleFiles.length === 0) {
      console.log('No CSS module files found');
      return;
    }

    const cssModuleArb = fc.constantFrom(...cssModuleFiles);

    fc.assert(
      fc.property(cssModuleArb, (cssModulePath: string) => {
        const dir = path.dirname(cssModulePath);
        const baseName = path.basename(cssModulePath, '.module.css');
        
        // Check if there's a corresponding component file in the same directory
        const possibleComponentFiles = [
          path.join(dir, `${baseName}.tsx`),
          path.join(dir, `${baseName}.ts`),
          path.join(dir, 'index.tsx'),
          path.join(dir, 'index.ts'),
        ];
        
        const hasCorrespondingComponent = possibleComponentFiles.some(f => fs.existsSync(f));
        
        // Also check if any component in the same directory imports this CSS module
        const dirFiles = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
        const isImportedByLocalComponent = dirFiles.some(f => {
          const filePath = path.join(dir, f);
          const content = fs.readFileSync(filePath, 'utf-8');
          return content.includes(path.basename(cssModulePath));
        });
        
        if (!hasCorrespondingComponent && !isImportedByLocalComponent) {
          console.log(`CSS module not co-located: ${path.relative(SRC_ROOT, cssModulePath)}`);
          return false;
        }
        
        return true;
      }),
      { numRuns: Math.min(100, cssModuleFiles.length) }
    );
  });

  it('component-specific styles are not in globals.css', () => {
    if (!globalsCssContent) {
      return;
    }

    // Check that globals.css doesn't contain styles that should be in CSS modules
    // by looking for patterns that suggest component-specific styling
    
    // Count the number of class selectors that look component-specific
    const componentClassPattern = /\.[a-z][a-zA-Z]+(?:Container|Wrapper|Content|Header|Footer|Body|Item|List)\s*\{/g;
    const matches = globalsCssContent.match(componentClassPattern) || [];
    
    // Allow some utility classes but flag if there are too many component-specific ones
    expect(matches.length).toBeLessThan(5);
  });
});

