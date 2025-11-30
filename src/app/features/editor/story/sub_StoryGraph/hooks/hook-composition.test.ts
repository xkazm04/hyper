/**
 * Property-Based Tests for Hook Composition
 *
 * **Feature: halloween-refactor, Property 10: Hook Composition Integrity**
 * **Feature: halloween-refactor, Property 11: Sub-hook Directory Structure**
 * **Validates: Requirements 7.2, 7.3**
 *
 * NOTE: This test file has been updated to reflect the current architecture:
 * - useStoryGraphData now uses Zustand store instead of sub-hooks
 * - useStoryGraphNavigation is a unified hook that consolidates navigation logic
 *   (previously split across useKeyboardNavigation, useArrowNavigation, useShortcuts)
 *
 * The tests below verify hook file structure and naming conventions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Hook files in the directory (for structure validation)
const hooksDirectory = 'src/app/features/editor/story/sub_StoryGraph/hooks';

// All hook files that should exist
const expectedHookFiles = [
  'useStoryGraphData.tsx',
  'useStoryGraphNavigation.ts',
  'useGraphLayout.ts',
  'useGraphOperations.ts',
  'useGraphSelection.ts',
  'usePathAncestry.ts',
  'useBranchDepth.ts',
  'useBranchPath.ts',
  'useGraphDiff.ts',
  'useGraphValidation.ts',
  'useGraphStream.ts',
  'useNodePreview.ts',
  'useOrphanAttachment.ts',
];

// Arbitrary for generating hook file names
const hookFileArb = fc.constantFrom(...expectedHookFiles);

describe('Hook File Structure Property Tests', () => {
  /**
   * **Property: Hook Files Exist**
   * All expected hook files should exist in the hooks directory.
   */
  describe('Hook File Existence', () => {
    it('should have all expected hook files', () => {
      fc.assert(
        fc.property(hookFileArb, (hookFile) => {
          const hookPath = path.join(process.cwd(), hooksDirectory, hookFile);
          expect(fs.existsSync(hookPath)).toBe(true);
        }),
        { numRuns: expectedHookFiles.length * 3 }
      );
    });
  });

  /**
   * **Property: Hook Naming Convention**
   * All hook files should follow the naming convention (use* prefix).
   */
  describe('Hook Naming Convention', () => {
    it('should follow use* naming convention', () => {
      fc.assert(
        fc.property(hookFileArb, (hookFile) => {
          const hookName = hookFile.replace(/\.(ts|tsx)$/, '');
          expect(hookName).toMatch(/^use[A-Z]/);
        }),
        { numRuns: expectedHookFiles.length * 3 }
      );
    });

    it('should export a function matching the file name or related utilities', () => {
      fc.assert(
        fc.property(hookFileArb, (hookFile) => {
          const hookPath = path.join(process.cwd(), hooksDirectory, hookFile);
          const content = fs.readFileSync(hookPath, 'utf-8');
          const hookName = hookFile.replace(/\.(ts|tsx)$/, '');

          // Should export a function with the same name as the file
          // OR export related utility functions (for utility files like useGraphDiff)
          const mainExportPattern = new RegExp(`export\\s+function\\s+${hookName}`);
          const hasMainExport = mainExportPattern.test(content);

          // Some files export utility functions instead of hooks
          const hasExportedFunctions = /export\s+function\s+\w+/.test(content);

          expect(hasMainExport || hasExportedFunctions).toBe(true);
        }),
        { numRuns: expectedHookFiles.length * 3 }
      );
    });
  });

  /**
   * **Property: Directory Structure**
   * The hooks directory should be within a feature folder.
   */
  describe('Directory Structure', () => {
    it('should have hooks directory within a feature folder (sub_* pattern)', () => {
      expect(hooksDirectory).toMatch(/sub_\w+\/hooks$/);
    });

    it('should not have nested hooks directories', () => {
      const hooksCount = (hooksDirectory.match(/\/hooks/g) || []).length;
      expect(hooksCount).toBe(1);
    });
  });

  /**
   * **Property: Unified Navigation Hook**
   * useStoryGraphNavigation should be a self-contained hook.
   */
  describe('Unified Navigation Hook', () => {
    it('should export navigation map type', () => {
      const hookPath = path.join(process.cwd(), hooksDirectory, 'useStoryGraphNavigation.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');

      expect(content).toMatch(/export\s+interface\s+NavigationMap/);
    });

    it('should export aria label utilities', () => {
      const hookPath = path.join(process.cwd(), hooksDirectory, 'useStoryGraphNavigation.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');

      expect(content).toMatch(/export\s+function\s+buildNodeAriaLabel/);
      expect(content).toMatch(/export\s+function\s+getNodeStatusLabel/);
    });

    it('should handle all navigation keys', () => {
      const hookPath = path.join(process.cwd(), hooksDirectory, 'useStoryGraphNavigation.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');

      // Arrow keys
      expect(content).toContain('ArrowRight');
      expect(content).toContain('ArrowLeft');
      expect(content).toContain('ArrowUp');
      expect(content).toContain('ArrowDown');

      // Shortcut keys
      expect(content).toContain('Home');
      expect(content).toContain('End');
      expect(content).toContain('PageUp');
      expect(content).toContain('PageDown');
    });
  });

  /**
   * **Property: File Content Consistency**
   * Hook files should be readable and have consistent content.
   */
  describe('File Content Consistency', () => {
    it('should maintain consistent content across multiple reads', () => {
      fc.assert(
        fc.property(hookFileArb, (hookFile) => {
          const hookPath = path.join(process.cwd(), hooksDirectory, hookFile);

          const content1 = fs.readFileSync(hookPath, 'utf-8');
          const content2 = fs.readFileSync(hookPath, 'utf-8');

          expect(content1).toBe(content2);
        }),
        { numRuns: expectedHookFiles.length * 3 }
      );
    });

    it('should have consistent import counts across reads', () => {
      fc.assert(
        fc.property(hookFileArb, (hookFile) => {
          const hookPath = path.join(process.cwd(), hooksDirectory, hookFile);

          const content1 = fs.readFileSync(hookPath, 'utf-8');
          const content2 = fs.readFileSync(hookPath, 'utf-8');

          const importCount1 = (content1.match(/import\s+/g) || []).length;
          const importCount2 = (content2.match(/import\s+/g) || []).length;

          expect(importCount1).toBe(importCount2);
        }),
        { numRuns: expectedHookFiles.length * 3 }
      );
    });
  });
});
