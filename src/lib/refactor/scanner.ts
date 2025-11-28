/**
 * File Scanner Utility for Halloween Refactoring
 * Scans directories to identify large files (>200 lines) for refactoring
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import * as fs from 'fs';
import * as path from 'path';

export type FileCategory = 
  | 'component' 
  | 'service' 
  | 'hook' 
  | 'type' 
  | 'style' 
  | 'util';

export interface FileInfo {
  path: string;
  lineCount: number;
  category: FileCategory;
  priority: number;
}

export interface ScanResult {
  files: FileInfo[];
  totalLines: number;
  byCategory: Record<FileCategory, FileInfo[]>;
}

const LINE_THRESHOLD = 200;

/**
 * Counts the number of lines in a file
 */
export function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

/**
 * Categorizes a file based on its path and naming conventions
 * Requirements: 1.2
 */
export function categorizeFile(filePath: string): FileCategory {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(normalizedPath);
  const ext = path.extname(fileName).toLowerCase();
  
  // Style files
  if (ext === '.css' || ext === '.scss' || ext === '.sass') {
    return 'style';
  }
  
  // Type definition files
  if (normalizedPath.includes('/types/') || fileName.endsWith('.d.ts') || fileName === 'types.ts') {
    return 'type';
  }
  
  // Hook files - check for use* naming convention or hooks directory
  if (normalizedPath.includes('/hooks/') || /^use[A-Z]/.test(fileName)) {
    return 'hook';
  }
  
  // Service files
  if (normalizedPath.includes('/services/') || fileName.endsWith('.service.ts')) {
    return 'service';
  }

  // Component files - .tsx files or in components directory
  if (ext === '.tsx' || normalizedPath.includes('/components/')) {
    return 'component';
  }
  
  // Default to util for other .ts files
  return 'util';
}

/**
 * Prioritizes files by line count in descending order
 * Requirements: 1.3
 */
export function prioritizeFiles(files: FileInfo[]): FileInfo[] {
  return [...files].sort((a, b) => b.lineCount - a.lineCount);
}

/**
 * Checks if a file should be included in the scan
 */
function shouldIncludeFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const validExtensions = ['.ts', '.tsx', '.css'];
  
  // Exclude node_modules, .next, and test files
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (
    normalizedPath.includes('node_modules') ||
    normalizedPath.includes('.next') ||
    normalizedPath.includes('__tests__') ||
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.')
  ) {
    return false;
  }
  
  return validExtensions.includes(ext);
}

/**
 * Recursively scans a directory for files
 */
function scanDirectoryRecursive(dirPath: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectoryRecursive(fullPath, files);
      }
    } else if (entry.isFile() && shouldIncludeFile(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Scans a directory and returns all files exceeding the line threshold
 * Requirements: 1.1
 */
export function scanDirectory(rootPath: string, threshold: number = LINE_THRESHOLD): ScanResult {
  const allFiles = scanDirectoryRecursive(rootPath);
  const largeFiles: FileInfo[] = [];
  
  for (const filePath of allFiles) {
    const lineCount = countLines(filePath);
    
    if (lineCount > threshold) {
      const category = categorizeFile(filePath);
      largeFiles.push({
        path: filePath,
        lineCount,
        category,
        priority: lineCount, // Priority equals line count for sorting
      });
    }
  }
  
  // Sort by priority (line count descending)
  const prioritized = prioritizeFiles(largeFiles);
  
  // Group by category
  const byCategory: Record<FileCategory, FileInfo[]> = {
    component: [],
    service: [],
    hook: [],
    type: [],
    style: [],
    util: [],
  };
  
  for (const file of prioritized) {
    byCategory[file.category].push(file);
  }
  
  const totalLines = prioritized.reduce((sum, f) => sum + f.lineCount, 0);
  
  return {
    files: prioritized,
    totalLines,
    byCategory,
  };
}

/**
 * Scans and returns files above a specific line count
 */
export function findLargeFiles(rootPath: string, minLines: number = LINE_THRESHOLD): FileInfo[] {
  const result = scanDirectory(rootPath, minLines);
  return result.files;
}
