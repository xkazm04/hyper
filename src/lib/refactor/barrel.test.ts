/**
 * Property-Based Tests for Barrel File Generator
 * 
 * **Feature: halloween-refactor, Property 5: Barrel Export Completeness**
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateBarrelFile,
  generateNamedExportLine,
  generateDefaultExportLine,
  generateModuleExports,
  collectAllExports,
  createExportInfo,
  ExportInfo,
  BarrelConfig,
} from './barrel';

// Arbitrary for generating valid TypeScript identifiers
const identifierArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,20}$/);

// Arbitrary for generating module paths (without extension)
const modulePathArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9\/\-_]{0,30}$/);

// Arbitrary for generating ExportInfo objects
const exportInfoArb: fc.Arbitrary<ExportInfo> = fc.record({
  modulePath: modulePathArb,
  namedExports: fc.array(identifierArb, { minLength: 0, maxLength: 10 }),
  defaultExport: fc.option(identifierArb, { nil: undefined }),
});

// Arbitrary for generating BarrelConfig objects
const barrelConfigArb: fc.Arbitrary<BarrelConfig> = fc.record({
  exports: fc.array(exportInfoArb, { minLength: 0, maxLength: 20 }),
  includeHeader: fc.option(fc.boolean(), { nil: undefined }),
  headerText: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

describe('Barrel Generator Property Tests', () => {
  /**
   * **Feature: halloween-refactor, Property 5: Barrel Export Completeness**
   * *For any* created sub-module, the index.ts barrel file SHALL export all 
   * public symbols from the module's components.
   * **Validates: Requirements 2.5**
   */
  describe('Property 5: Barrel Export Completeness', () => {
    it('should include all named exports in the generated barrel file', () => {
      fc.assert(
        fc.property(exportInfoArb, (exportInfo) => {
          const barrelContent = generateBarrelFile({ exports: [exportInfo] });
          
          // Every named export should appear in the barrel file
          for (const namedExport of exportInfo.namedExports) {
            expect(barrelContent).toContain(namedExport);
          }
        }),
        { numRuns: 100 }
      );
    });


    it('should include default export in the generated barrel file when present', () => {
      fc.assert(
        fc.property(
          exportInfoArb.filter(e => e.defaultExport !== undefined),
          (exportInfo) => {
            const barrelContent = generateBarrelFile({ exports: [exportInfo] });
            
            // Default export should appear in the barrel file
            expect(barrelContent).toContain(exportInfo.defaultExport);
            expect(barrelContent).toContain('default as');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include module path in export statements', () => {
      fc.assert(
        fc.property(
          exportInfoArb.filter(e => e.namedExports.length > 0 || e.defaultExport !== undefined),
          (exportInfo) => {
            const barrelContent = generateBarrelFile({ exports: [exportInfo] });
            
            // Module path should appear in the barrel file
            expect(barrelContent).toContain(exportInfo.modulePath);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should collect all exports from multiple modules', () => {
      fc.assert(
        fc.property(barrelConfigArb, (config) => {
          const allExports = collectAllExports(config.exports);
          const barrelContent = generateBarrelFile(config);
          
          // Every collected export should appear in the barrel file
          for (const exp of allExports) {
            expect(barrelContent).toContain(exp);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid export syntax for named exports', () => {
      fc.assert(
        fc.property(
          exportInfoArb.filter(e => e.namedExports.length > 0),
          (exportInfo) => {
            const line = generateNamedExportLine(exportInfo);
            
            // Should have proper export syntax
            expect(line).toMatch(/^export \{ .+ \} from '\.\/.+';$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid export syntax for default exports', () => {
      fc.assert(
        fc.property(
          exportInfoArb.filter(e => e.defaultExport !== undefined),
          (exportInfo) => {
            const line = generateDefaultExportLine(exportInfo);
            
            // Should have proper default export syntax
            expect(line).toMatch(/^export \{ default as \w+ \} from '\.\/.+';$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty string for empty named exports', () => {
      fc.assert(
        fc.property(modulePathArb, (modulePath) => {
          const exportInfo = createExportInfo(modulePath, []);
          const line = generateNamedExportLine(exportInfo);
          
          expect(line).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty string when no default export', () => {
      fc.assert(
        fc.property(modulePathArb, fc.array(identifierArb), (modulePath, namedExports) => {
          const exportInfo = createExportInfo(modulePath, namedExports);
          const line = generateDefaultExportLine(exportInfo);
          
          expect(line).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('should generate both named and default exports for a module', () => {
      fc.assert(
        fc.property(
          exportInfoArb.filter(e => e.namedExports.length > 0 && e.defaultExport !== undefined),
          (exportInfo) => {
            const lines = generateModuleExports(exportInfo);
            
            // Should have at least 2 lines (named + default)
            expect(lines.length).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should end barrel file with newline', () => {
      fc.assert(
        fc.property(barrelConfigArb, (config) => {
          const barrelContent = generateBarrelFile(config);
          
          expect(barrelContent.endsWith('\n')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
