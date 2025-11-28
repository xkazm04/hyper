/**
 * Refactoring Infrastructure Module
 * Provides utilities for scanning, categorizing, and generating barrel files
 */

export {
  type FileCategory,
  type FileInfo,
  type ScanResult,
  countLines,
  categorizeFile,
  prioritizeFiles,
  scanDirectory,
  findLargeFiles,
} from './scanner';

export {
  type ExportInfo,
  type BarrelConfig,
  generateNamedExportLine,
  generateDefaultExportLine,
  generateModuleExports,
  generateBarrelFile,
  parseExportsFromContent,
  createExportInfo,
  collectAllExports,
} from './barrel';
