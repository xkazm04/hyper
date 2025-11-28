/**
 * Barrel File Generator Utility
 * Generates index.ts barrel files for module exports
 * 
 * Requirements: 2.5
 */

export interface ExportInfo {
  /** The module path relative to the barrel file (without extension) */
  modulePath: string;
  /** Named exports from the module */
  namedExports: string[];
  /** Default export name (if any) */
  defaultExport?: string;
}

export interface BarrelConfig {
  /** List of exports to include in the barrel file */
  exports: ExportInfo[];
  /** Whether to add a header comment */
  includeHeader?: boolean;
  /** Custom header text */
  headerText?: string;
}

/**
 * Generates a single export line for named exports
 */
export function generateNamedExportLine(exportInfo: ExportInfo): string {
  if (exportInfo.namedExports.length === 0) {
    return '';
  }
  
  const exports = exportInfo.namedExports.join(', ');
  return `export { ${exports} } from './${exportInfo.modulePath}';`;
}

/**
 * Generates a single export line for default export
 */
export function generateDefaultExportLine(exportInfo: ExportInfo): string {
  if (!exportInfo.defaultExport) {
    return '';
  }
  
  return `export { default as ${exportInfo.defaultExport} } from './${exportInfo.modulePath}';`;
}

/**
 * Generates all export lines for a single module
 */
export function generateModuleExports(exportInfo: ExportInfo): string[] {
  const lines: string[] = [];
  
  // Add named exports
  const namedLine = generateNamedExportLine(exportInfo);
  if (namedLine) {
    lines.push(namedLine);
  }

  // Add default export
  const defaultLine = generateDefaultExportLine(exportInfo);
  if (defaultLine) {
    lines.push(defaultLine);
  }
  
  return lines;
}

/**
 * Generates a complete barrel file content
 * Requirements: 2.5
 */
export function generateBarrelFile(config: BarrelConfig): string {
  const lines: string[] = [];
  
  // Add header if requested
  if (config.includeHeader !== false) {
    const headerText = config.headerText || 'Auto-generated barrel file';
    lines.push(`/**`);
    lines.push(` * ${headerText}`);
    lines.push(` */`);
    lines.push('');
  }
  
  // Generate exports for each module
  for (const exportInfo of config.exports) {
    const moduleLines = generateModuleExports(exportInfo);
    lines.push(...moduleLines);
  }
  
  // Ensure file ends with newline
  return lines.join('\n') + '\n';
}

/**
 * Parses export statements from a TypeScript file content
 * Returns the named exports and default export found
 */
export function parseExportsFromContent(content: string): { namedExports: string[]; hasDefaultExport: boolean } {
  const namedExports: string[] = [];
  let hasDefaultExport = false;
  
  // Match export declarations: export const/let/var/function/class/interface/type/enum
  const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    namedExports.push(match[1]);
  }
  
  // Match export { ... } statements
  const exportBlockRegex = /export\s*\{([^}]+)\}/g;
  while ((match = exportBlockRegex.exec(content)) !== null) {
    const exports = match[1].split(',').map(e => {
      // Handle "name as alias" syntax - use the alias
      const parts = e.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    }).filter(e => e && e !== 'default');
    namedExports.push(...exports);
  }
  
  // Check for default export
  if (/export\s+default\s+/.test(content) || /export\s*\{\s*[^}]*\bdefault\b/.test(content)) {
    hasDefaultExport = true;
  }
  
  // Remove duplicates
  return {
    namedExports: [...new Set(namedExports)],
    hasDefaultExport,
  };
}

/**
 * Creates an ExportInfo object from module path and content
 */
export function createExportInfo(
  modulePath: string, 
  namedExports: string[], 
  defaultExportName?: string
): ExportInfo {
  return {
    modulePath,
    namedExports,
    defaultExport: defaultExportName,
  };
}

/**
 * Collects all exports from a list of ExportInfo objects
 * Returns a flat list of all export names
 */
export function collectAllExports(exports: ExportInfo[]): string[] {
  const allExports: string[] = [];
  
  for (const exp of exports) {
    allExports.push(...exp.namedExports);
    if (exp.defaultExport) {
      allExports.push(exp.defaultExport);
    }
  }
  
  return allExports;
}
