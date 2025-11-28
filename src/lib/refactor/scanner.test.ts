/**
 * Property-Based Tests for File Scanner
 * 
 * **Feature: halloween-refactor, Property 1: File Scanner Completeness**
 * **Feature: halloween-refactor, Property 2: File Categorization Consistency**
 * **Feature: halloween-refactor, Property 3: Priority Sorting Correctness**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  categorizeFile, 
  prioritizeFiles, 
  FileInfo, 
  FileCategory 
} from './scanner';

// Arbitrary for generating valid file paths
const filePathArb = fc.oneof(
  // Component paths
  fc.constantFrom(
    'src/components/Button.tsx',
    'src/components/Modal.tsx',
    'src/app/dashboard/page.tsx',
    'src/features/Editor/Editor.tsx'
  ),
  // Service paths
  fc.constantFrom(
    'src/lib/services/api.ts',
    'src/lib/services/auth.service.ts',
    'src/services/user.ts'
  ),
  // Hook paths
  fc.constantFrom(
    'src/lib/hooks/useAuth.ts',
    'src/hooks/useState.ts',
    'src/lib/useQuery.ts'
  ),
  // Type paths
  fc.constantFrom(
    'src/lib/types/index.ts',
    'src/types/user.ts',
    'src/lib/types.d.ts'
  ),
  // Style paths
  fc.constantFrom(
    'src/app/globals.css',
    'src/styles/theme.scss',
    'src/components/Button.css'
  ),
  // Util paths
  fc.constantFrom(
    'src/lib/utils.ts',
    'src/lib/helpers.ts',
    'src/utils/format.ts'
  )
);


// Arbitrary for generating FileInfo objects
const fileInfoArb = fc.record({
  path: filePathArb,
  lineCount: fc.integer({ min: 1, max: 10000 }),
  category: fc.constantFrom<FileCategory>('component', 'service', 'hook', 'type', 'style', 'util'),
  priority: fc.integer({ min: 1, max: 10000 }),
}).map(info => ({ ...info, priority: info.lineCount })); // Priority equals lineCount

const fileInfoArrayArb = fc.array(fileInfoArb, { minLength: 0, maxLength: 100 });

describe('File Scanner Property Tests', () => {
  /**
   * **Feature: halloween-refactor, Property 2: File Categorization Consistency**
   * *For any* file path, the categorizer SHALL return the same category when called 
   * multiple times, and the category SHALL match the file's location and naming convention.
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: File Categorization Consistency', () => {
    it('should return the same category for the same file path (idempotent)', () => {
      fc.assert(
        fc.property(filePathArb, (filePath) => {
          const category1 = categorizeFile(filePath);
          const category2 = categorizeFile(filePath);
          const category3 = categorizeFile(filePath);
          
          expect(category1).toBe(category2);
          expect(category2).toBe(category3);
        }),
        { numRuns: 100 }
      );
    });

    it('should categorize .css files as style', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('src/app/globals.css', 'src/styles/theme.css', 'src/components/Button.css'),
          (filePath) => {
            expect(categorizeFile(filePath)).toBe('style');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize files in /types/ directory as type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('src/lib/types/index.ts', 'src/types/user.ts', 'src/lib/types/nodes.ts'),
          (filePath) => {
            expect(categorizeFile(filePath)).toBe('type');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize files starting with use* as hook', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('src/lib/useAuth.ts', 'src/hooks/useState.ts', 'src/useQuery.ts'),
          (filePath) => {
            expect(categorizeFile(filePath)).toBe('hook');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize files in /services/ directory as service', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('src/lib/services/api.ts', 'src/services/user.ts'),
          (filePath) => {
            expect(categorizeFile(filePath)).toBe('service');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize .tsx files as component', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('src/components/Button.tsx', 'src/app/page.tsx', 'src/Editor.tsx'),
          (filePath) => {
            expect(categorizeFile(filePath)).toBe('component');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: halloween-refactor, Property 3: Priority Sorting Correctness**
   * *For any* list of FileInfo objects, prioritizeFiles SHALL return them sorted 
   * by lineCount in descending order.
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Priority Sorting Correctness', () => {
    it('should sort files by lineCount in descending order', () => {
      fc.assert(
        fc.property(fileInfoArrayArb, (files) => {
          const sorted = prioritizeFiles(files);
          
          // Verify descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].lineCount).toBeGreaterThanOrEqual(sorted[i + 1].lineCount);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all elements (no elements lost or added)', () => {
      fc.assert(
        fc.property(fileInfoArrayArb, (files) => {
          const sorted = prioritizeFiles(files);
          
          // Same length
          expect(sorted.length).toBe(files.length);
          
          // Same total line count (invariant)
          const originalTotal = files.reduce((sum, f) => sum + f.lineCount, 0);
          const sortedTotal = sorted.reduce((sum, f) => sum + f.lineCount, 0);
          expect(sortedTotal).toBe(originalTotal);
        }),
        { numRuns: 100 }
      );
    });

    it('should not mutate the original array', () => {
      fc.assert(
        fc.property(fileInfoArrayArb, (files) => {
          const originalOrder = files.map(f => f.path);
          prioritizeFiles(files);
          const afterOrder = files.map(f => f.path);
          
          expect(afterOrder).toEqual(originalOrder);
        }),
        { numRuns: 100 }
      );
    });

    it('should be idempotent (sorting twice gives same result)', () => {
      fc.assert(
        fc.property(fileInfoArrayArb, (files) => {
          const sorted1 = prioritizeFiles(files);
          const sorted2 = prioritizeFiles(sorted1);
          
          expect(sorted2.map(f => f.lineCount)).toEqual(sorted1.map(f => f.lineCount));
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty arrays', () => {
      const result = prioritizeFiles([]);
      expect(result).toEqual([]);
    });

    it('should handle single element arrays', () => {
      fc.assert(
        fc.property(fileInfoArb, (file) => {
          const result = prioritizeFiles([file]);
          expect(result.length).toBe(1);
          expect(result[0]).toEqual(file);
        }),
        { numRuns: 100 }
      );
    });
  });
});
