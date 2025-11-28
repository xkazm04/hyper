/**
 * Property-Based Tests for Export Preservation
 * 
 * **Feature: halloween-refactor, Property 6: Export Preservation**
 * **Validates: Requirements 3.3, 6.3**
 * 
 * For any refactored service or type file, all previously exported symbols 
 * SHALL remain accessible from the original import path.
 * 
 * Note: These tests verify the structure and exports of the refactored modules
 * without requiring database connections.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Helper to read and parse export statements from a file
function getExportedSymbols(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exports: string[] = [];
  
  // Match export { ... } from statements (re-exports)
  const reExportMatches = content.matchAll(/export\s*\{([^}]+)\}\s*from/g);
  for (const match of reExportMatches) {
    const symbols = match[1].split(',').map(s => {
      // Handle "default as Name" and "Name as Alias"
      const parts = s.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    }).filter(s => s.length > 0);
    exports.push(...symbols);
  }
  
  // Match export { ... } statements (local exports without from)
  const localExportMatches = content.matchAll(/export\s*\{([^}]+)\}(?!\s*from)/g);
  for (const match of localExportMatches) {
    const symbols = match[1].split(',').map(s => {
      const parts = s.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    }).filter(s => s.length > 0);
    exports.push(...symbols);
  }
  
  // Match export class/function/const statements
  const directExportMatches = content.matchAll(/export\s+(class|function|const|let|var)\s+(\w+)/g);
  for (const match of directExportMatches) {
    exports.push(match[2]);
  }
  
  // Match export type { ... } statements
  const typeExportMatches = content.matchAll(/export\s+type\s*\{([^}]+)\}/g);
  for (const match of typeExportMatches) {
    const symbols = match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
    exports.push(...symbols);
  }
  
  // Match export type Name = ... statements
  const typeAliasMatches = content.matchAll(/export\s+type\s+(\w+)\s*=/g);
  for (const match of typeAliasMatches) {
    exports.push(match[1]);
  }
  
  // Match export interface Name statements
  const interfaceMatches = content.matchAll(/export\s+interface\s+(\w+)/g);
  for (const match of interfaceMatches) {
    exports.push(match[1]);
  }
  
  // Match export * from statements (indicates re-export of all)
  const starExportMatches = content.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g);
  for (const match of starExportMatches) {
    exports.push(`*:${match[1]}`);
  }
  
  return [...new Set(exports)];
}

// Helper to check if a barrel file re-exports from a module
function barrelReExportsFrom(barrelPath: string, modulePath: string): boolean {
  const content = fs.readFileSync(barrelPath, 'utf-8');
  return content.includes(modulePath);
}

const servicesDir = path.join(__dirname);

describe('Export Preservation Property Tests', () => {
  /**
   * **Feature: halloween-refactor, Property 6: Export Preservation**
   * *For any* refactored service or type file, all previously exported symbols 
   * SHALL remain accessible from the original import path.
   * **Validates: Requirements 3.3, 6.3**
   */
  describe('Property 6: Export Preservation', () => {
    describe('Marketplace Service Structure', () => {
      const marketplaceDir = path.join(servicesDir, 'marketplace');
      const marketplaceBarrel = path.join(servicesDir, 'marketplace.ts');
      
      it('should have barrel file that re-exports from marketplace/index', () => {
        const content = fs.readFileSync(marketplaceBarrel, 'utf-8');
        expect(content).toContain('./marketplace/index');
        expect(content).toContain('export');
      });

      it('should have all required sub-modules in marketplace directory', () => {
        const requiredModules = ['index.ts', 'types.ts', 'assets.ts', 'collections.ts', 'reviews.ts', 'api.ts'];
        
        fc.assert(
          fc.property(fc.constantFrom(...requiredModules), (moduleName) => {
            const modulePath = path.join(marketplaceDir, moduleName);
            expect(fs.existsSync(modulePath)).toBe(true);
          }),
          { numRuns: requiredModules.length }
        );
      });

      it('should export MarketplaceService from index', () => {
        const indexPath = path.join(marketplaceDir, 'index.ts');
        const exports = getExportedSymbols(indexPath);
        expect(exports).toContain('MarketplaceService');
      });

      it('should export sub-services from index', () => {
        const indexPath = path.join(marketplaceDir, 'index.ts');
        const exports = getExportedSymbols(indexPath);
        const expectedServices = ['AssetsService', 'CollectionsService', 'ReviewsService', 'ApiService'];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedServices), (serviceName) => {
            expect(exports).toContain(serviceName);
          }),
          { numRuns: expectedServices.length }
        );
      });

      it('should export mapping functions from types module', () => {
        const typesPath = path.join(marketplaceDir, 'types.ts');
        const exports = getExportedSymbols(typesPath);
        const expectedFunctions = [
          'mapCharacterAsset', 'mapCharacterAssets',
          'mapCuratedCollection', 'mapCuratedCollections',
          'mapAssetReview', 'mapAssetReviews',
          'mapApiKey', 'mapApiKeys',
          'mapAssetDownload', 'mapAssetDownloads',
        ];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedFunctions), (funcName) => {
            expect(exports).toContain(funcName);
          }),
          { numRuns: expectedFunctions.length }
        );
      });
    });

    describe('Story Service Structure', () => {
      const storyDir = path.join(servicesDir, 'story');
      const storyBarrel = path.join(servicesDir, 'story.ts');
      
      it('should have barrel file that re-exports from story/index', () => {
        const content = fs.readFileSync(storyBarrel, 'utf-8');
        expect(content).toContain('./story/index');
        expect(content).toContain('export');
      });

      it('should have all required sub-modules in story directory', () => {
        const requiredModules = ['index.ts', 'types.ts', 'crud.ts', 'cards.ts', 'characters.ts', 'publishing.ts'];
        
        fc.assert(
          fc.property(fc.constantFrom(...requiredModules), (moduleName) => {
            const modulePath = path.join(storyDir, moduleName);
            expect(fs.existsSync(modulePath)).toBe(true);
          }),
          { numRuns: requiredModules.length }
        );
      });

      it('should export StoryService from index', () => {
        const indexPath = path.join(storyDir, 'index.ts');
        const exports = getExportedSymbols(indexPath);
        expect(exports).toContain('StoryService');
      });

      it('should export sub-services from index', () => {
        const indexPath = path.join(storyDir, 'index.ts');
        const exports = getExportedSymbols(indexPath);
        const expectedServices = ['StoryCrudService', 'CardsService', 'CharactersService', 'PublishingService'];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedServices), (serviceName) => {
            expect(exports).toContain(serviceName);
          }),
          { numRuns: expectedServices.length }
        );
      });

      it('should export mapping functions from types module', () => {
        const typesPath = path.join(storyDir, 'types.ts');
        const exports = getExportedSymbols(typesPath);
        const expectedFunctions = [
          'mapStoryStack', 'mapStoryStacks',
          'mapStoryCard', 'mapStoryCards',
          'mapChoice', 'mapChoices',
          'mapCharacter', 'mapCharacters',
        ];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedFunctions), (funcName) => {
            expect(exports).toContain(funcName);
          }),
          { numRuns: expectedFunctions.length }
        );
      });

      it('should export error classes from types module', () => {
        const typesPath = path.join(storyDir, 'types.ts');
        const exports = getExportedSymbols(typesPath);
        const expectedErrors = [
          'StoryNotFoundError', 'CardNotFoundError',
          'ChoiceNotFoundError', 'CharacterNotFoundError', 'DatabaseError',
        ];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedErrors), (errorName) => {
            expect(exports).toContain(errorName);
          }),
          { numRuns: expectedErrors.length }
        );
      });
    });

    describe('Sync Service Structure', () => {
      const syncDir = path.join(servicesDir, 'sync');
      const syncBarrel = path.join(servicesDir, 'sync.ts');
      
      it('should have barrel file that re-exports from sync/index', () => {
        const content = fs.readFileSync(syncBarrel, 'utf-8');
        expect(content).toContain('./sync/index');
        expect(content).toContain('export');
      });

      it('should have all required sub-modules in sync directory', () => {
        const requiredModules = ['index.ts', 'types.ts', 'queue.ts', 'operations.ts', 'conflict.ts'];
        
        fc.assert(
          fc.property(fc.constantFrom(...requiredModules), (moduleName) => {
            const modulePath = path.join(syncDir, moduleName);
            expect(fs.existsSync(modulePath)).toBe(true);
          }),
          { numRuns: requiredModules.length }
        );
      });

      it('should export SyncService and syncService from index', () => {
        const indexPath = path.join(syncDir, 'index.ts');
        const exports = getExportedSymbols(indexPath);
        expect(exports).toContain('SyncService');
        expect(exports).toContain('syncService');
      });

      it('should export sub-services from index', () => {
        const indexPath = path.join(syncDir, 'index.ts');
        const exports = getExportedSymbols(indexPath);
        const expectedServices = ['QueueService', 'OperationsService', 'ConflictService'];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedServices), (serviceName) => {
            expect(exports).toContain(serviceName);
          }),
          { numRuns: expectedServices.length }
        );
      });

      it('should export type definitions from types module', () => {
        const typesPath = path.join(syncDir, 'types.ts');
        const exports = getExportedSymbols(typesPath);
        const expectedTypes = ['SyncEventType', 'SyncEvent', 'SyncStatus'];
        
        fc.assert(
          fc.property(fc.constantFrom(...expectedTypes), (typeName) => {
            expect(exports).toContain(typeName);
          }),
          { numRuns: expectedTypes.length }
        );
      });
    });

    describe('Cross-module consistency', () => {
      it('should have consistent barrel file pattern across all services', () => {
        const barrelFiles = ['marketplace.ts', 'story.ts', 'sync.ts'];
        
        fc.assert(
          fc.property(fc.constantFrom(...barrelFiles), (barrelFile) => {
            const barrelPath = path.join(servicesDir, barrelFile);
            const content = fs.readFileSync(barrelPath, 'utf-8');
            
            // Should contain re-export pattern
            expect(content).toContain('export *');
            expect(content).toContain('from');
            
            // Should reference the corresponding directory
            const dirName = barrelFile.replace('.ts', '');
            expect(content).toContain(`./${dirName}/index`);
          }),
          { numRuns: barrelFiles.length }
        );
      });

      it('should have index.ts in each service directory', () => {
        const serviceDirs = ['marketplace', 'story', 'sync'];
        
        fc.assert(
          fc.property(fc.constantFrom(...serviceDirs), (dirName) => {
            const indexPath = path.join(servicesDir, dirName, 'index.ts');
            expect(fs.existsSync(indexPath)).toBe(true);
          }),
          { numRuns: serviceDirs.length }
        );
      });

      it('should have types.ts in each service directory', () => {
        const serviceDirs = ['marketplace', 'story', 'sync'];
        
        fc.assert(
          fc.property(fc.constantFrom(...serviceDirs), (dirName) => {
            const typesPath = path.join(servicesDir, dirName, 'types.ts');
            expect(fs.existsSync(typesPath)).toBe(true);
          }),
          { numRuns: serviceDirs.length }
        );
      });
    });
  });
});
