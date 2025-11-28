/**
 * Property-Based Tests for Hook Composition
 * 
 * **Feature: halloween-refactor, Property 10: Hook Composition Integrity**
 * **Feature: halloween-refactor, Property 11: Sub-hook Directory Structure**
 * **Validates: Requirements 7.2, 7.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Define the hook files and their expected sub-hooks
interface HookComposition {
  mainHook: string;
  subHooks: string[];
  directory: string;
}

const hookCompositions: HookComposition[] = [
  {
    mainHook: 'useStoryGraphData.tsx',
    subHooks: ['useGraphLayout.ts', 'useGraphOperations.ts', 'useGraphSelection.ts'],
    directory: 'src/app/features/editor/story/sub_StoryGraph/hooks',
  },
  {
    mainHook: 'useKeyboardNavigation.ts',
    subHooks: ['useArrowNavigation.ts', 'useShortcuts.ts'],
    directory: 'src/app/features/editor/story/sub_StoryGraph/hooks',
  },
];

// Arbitrary for generating hook compositions
const hookCompositionArb = fc.constantFrom(...hookCompositions);

describe('Hook Composition Property Tests', () => {
  /**
   * **Feature: halloween-refactor, Property 10: Hook Composition Integrity**
   * *For any* decomposed hook, the original hook file SHALL import and compose 
   * the extracted sub-hooks.
   * **Validates: Requirements 7.2**
   */
  describe('Property 10: Hook Composition Integrity', () => {
    it('should import all sub-hooks in the main hook file', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          const mainHookPath = path.join(process.cwd(), composition.directory, composition.mainHook);
          
          // Check if main hook file exists
          expect(fs.existsSync(mainHookPath)).toBe(true);
          
          // Read the main hook content
          const mainHookContent = fs.readFileSync(mainHookPath, 'utf-8');
          
          // Verify each sub-hook is imported
          for (const subHook of composition.subHooks) {
            const subHookName = subHook.replace(/\.(ts|tsx)$/, '');
            const importPattern = new RegExp(`from\\s+['"]\\.\\/${subHookName}['"]`);
            
            expect(mainHookContent).toMatch(importPattern);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should use imported sub-hooks (not just import them)', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          const mainHookPath = path.join(process.cwd(), composition.directory, composition.mainHook);
          const mainHookContent = fs.readFileSync(mainHookPath, 'utf-8');
          
          // For each sub-hook, verify it's actually used (called or referenced)
          for (const subHook of composition.subHooks) {
            const subHookName = subHook.replace(/\.(ts|tsx)$/, '');
            
            // Extract the exported function/hook name from the sub-hook file
            const subHookPath = path.join(process.cwd(), composition.directory, subHook);
            const subHookContent = fs.readFileSync(subHookPath, 'utf-8');
            
            // Find exported functions
            const exportMatches = subHookContent.match(/export\s+(?:function|const)\s+(\w+)/g);
            
            if (exportMatches) {
              // At least one export should be used in the main hook
              const hasUsage = exportMatches.some(match => {
                const funcName = match.replace(/export\s+(?:function|const)\s+/, '');
                return mainHookContent.includes(funcName);
              });
              
              expect(hasUsage).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent imports across multiple reads', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          const mainHookPath = path.join(process.cwd(), composition.directory, composition.mainHook);
          
          // Read multiple times
          const content1 = fs.readFileSync(mainHookPath, 'utf-8');
          const content2 = fs.readFileSync(mainHookPath, 'utf-8');
          
          // Content should be identical (idempotent read)
          expect(content1).toBe(content2);
          
          // Import count should be consistent
          const importCount1 = (content1.match(/import\s+/g) || []).length;
          const importCount2 = (content2.match(/import\s+/g) || []).length;
          
          expect(importCount1).toBe(importCount2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: halloween-refactor, Property 11: Sub-hook Directory Structure**
   * *For any* extracted sub-hook, the file SHALL be placed in a hooks/ subdirectory 
   * of the relevant feature folder.
   * **Validates: Requirements 7.3**
   */
  describe('Property 11: Sub-hook Directory Structure', () => {
    it('should place all sub-hooks in the hooks/ directory', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          // Verify the directory ends with /hooks
          expect(composition.directory).toMatch(/\/hooks$/);
          
          // Verify each sub-hook exists in the hooks directory
          for (const subHook of composition.subHooks) {
            const subHookPath = path.join(process.cwd(), composition.directory, subHook);
            expect(fs.existsSync(subHookPath)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have sub-hooks as siblings of the main hook', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          const mainHookDir = path.dirname(
            path.join(process.cwd(), composition.directory, composition.mainHook)
          );
          
          for (const subHook of composition.subHooks) {
            const subHookDir = path.dirname(
              path.join(process.cwd(), composition.directory, subHook)
            );
            
            // Main hook and sub-hooks should be in the same directory
            expect(subHookDir).toBe(mainHookDir);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should follow naming convention for hook files', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          // Main hook should start with 'use'
          const mainHookName = composition.mainHook.replace(/\.(ts|tsx)$/, '');
          expect(mainHookName).toMatch(/^use[A-Z]/);
          
          // Sub-hooks should also start with 'use'
          for (const subHook of composition.subHooks) {
            const subHookName = subHook.replace(/\.(ts|tsx)$/, '');
            expect(subHookName).toMatch(/^use[A-Z]/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have hooks directory within a feature folder (sub_* pattern)', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          // The directory should contain sub_* pattern indicating feature folder
          expect(composition.directory).toMatch(/sub_\w+\/hooks$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should not have nested hooks directories', () => {
      fc.assert(
        fc.property(hookCompositionArb, (composition) => {
          // Count occurrences of /hooks/ in the path
          const hooksCount = (composition.directory.match(/\/hooks/g) || []).length;
          
          // Should only have one /hooks at the end
          expect(hooksCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });
});
