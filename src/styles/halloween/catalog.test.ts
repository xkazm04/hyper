/**
 * Property-Based Tests for Halloween Effect Catalog Completeness
 * 
 * **Feature: halloween-refactor, Property 12: Effect Catalog Field Completeness**
 * **Feature: halloween-refactor, Property 13: Utility Class Availability**
 * **Validates: Requirements 8.2, 8.3**
 * 
 * Tests that:
 * - Every effect in the catalog includes: effect name, CSS class, applicable components, CSS content
 * - Every documented effect has a corresponding utility CSS class in the stylesheet
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the files
let effectsCssContent: string;
let catalogMdContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'effects.css');
  const mdPath = path.join(__dirname, 'EFFECTS.md');
  effectsCssContent = fs.readFileSync(cssPath, 'utf-8');
  catalogMdContent = fs.readFileSync(mdPath, 'utf-8');
});

// Define the 8 Halloween effects from the design document
const HALLOWEEN_EFFECTS = [
  { id: 'ghost-float', name: 'Ghost Float', cssClass: 'halloween-ghost-float' },
  { id: 'spider-web-corner', name: 'Spider Web Corner', cssClass: 'halloween-spider-web-corner' },
  { id: 'candle-flicker', name: 'Candle Flicker', cssClass: 'halloween-candle-flicker' },
  { id: 'bat-silhouette', name: 'Bat Silhouette', cssClass: 'halloween-bat-silhouette' },
  { id: 'cauldron-bubble', name: 'Cauldron Bubble', cssClass: 'halloween-cauldron-bubble' },
  { id: 'pumpkin-glow', name: 'Pumpkin Glow', cssClass: 'halloween-pumpkin-glow' },
  { id: 'skeleton-rattle', name: 'Skeleton Rattle', cssClass: 'halloween-skeleton-rattle' },
  { id: 'fog-overlay', name: 'Fog Overlay', cssClass: 'halloween-fog-overlay' },
] as const;

type HalloweenEffectDef = typeof HALLOWEEN_EFFECTS[number];

// Generator for Halloween effect definitions
const halloweenEffectArb = fc.constantFrom(...HALLOWEEN_EFFECTS);

describe('Property 12: Effect Catalog Field Completeness', () => {
  /**
   * Property 12: For any entry in the Halloween effect catalog, 
   * the entry SHALL include: effect name, CSS class, applicable components list, and CSS content
   */
  it('every catalog entry includes effect name', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Check that the effect name appears in the catalog
        return catalogMdContent.includes(effect.name);
      }),
      { numRuns: 100 }
    );
  });

  it('every catalog entry includes CSS class', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Check that the CSS class is documented
        return catalogMdContent.includes(effect.cssClass);
      }),
      { numRuns: 100 }
    );
  });

  it('every catalog entry includes applicable components list', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Find the section for this effect
        const effectSection = extractCatalogSection(catalogMdContent, effect.name);
        
        // Check for "Applicable Components" heading or similar
        const hasApplicableComponents = 
          /applicable\s+components?/i.test(effectSection) ||
          /applicable\s+to/i.test(effectSection);
        
        return hasApplicableComponents;
      }),
      { numRuns: 100 }
    );
  });

  it('every catalog entry includes usage example', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Find the section for this effect
        const effectSection = extractCatalogSection(catalogMdContent, effect.name);
        
        // Check for code example (```tsx or ```jsx or ```html)
        const hasCodeExample = /```(?:tsx|jsx|html|css)/.test(effectSection);
        
        return hasCodeExample;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 13: Utility Class Availability', () => {
  /**
   * Property 13: For any documented Halloween effect pattern, 
   * a corresponding utility CSS class SHALL exist in the stylesheet
   */
  it('every documented effect has a corresponding CSS class in the stylesheet', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Check that the CSS class exists in effects.css
        const classInCss = effectsCssContent.includes(effect.cssClass);
        
        return classInCss;
      }),
      { numRuns: 100 }
    );
  });

  it('every documented effect CSS class is properly scoped to .halloween', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Check that the class is scoped under .halloween
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}|\\.halloween\\s*\\.${effect.cssClass}`,
          'g'
        );
        
        return scopedClassRegex.test(effectsCssContent);
      }),
      { numRuns: 100 }
    );
  });

  it('every documented effect appears in the quick reference table', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effect: HalloweenEffectDef) => {
        // Check that the effect appears in the quick reference table
        // The table format is: | Effect | CSS Class | Applicable Components |
        const tableRowRegex = new RegExp(
          `\\|\\s*${effect.name}\\s*\\|\\s*\`${effect.cssClass}\`\\s*\\|`,
          'i'
        );
        
        return tableRowRegex.test(catalogMdContent);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to extract the catalog section for a specific effect
 */
function extractCatalogSection(md: string, effectName: string): string {
  // Find the heading for this effect (### N. Effect Name)
  const headingRegex = new RegExp(`###\\s+\\d+\\.\\s+${effectName}`, 'i');
  const headingMatch = md.match(headingRegex);
  
  if (!headingMatch) {
    return '';
  }
  
  const startIndex = md.indexOf(headingMatch[0]);
  
  // Find the next ### heading or end of file
  const nextHeadingRegex = /###\s+\d+\./g;
  nextHeadingRegex.lastIndex = startIndex + headingMatch[0].length;
  const nextMatch = nextHeadingRegex.exec(md);
  
  const endIndex = nextMatch ? nextMatch.index : md.length;
  
  return md.slice(startIndex, endIndex);
}
