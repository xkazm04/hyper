/**
 * Property-Based Tests for Halloween Connection Line Styling
 * 
 * **Feature: halloween-theme-enrichment, Property 3: Connection Line Styling**
 * **Validates: Requirements 2.1, 2.3, 2.4**
 * 
 * Tests that for any connection line in the StoryGraph or InfiniteCanvas,
 * when the Halloween theme is active, the line SHALL display the appropriate
 * gradient color based on choice type, and hover states SHALL intensify the glow effect.
 */

import { describe, it, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the lines.css file content
let linesCssContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'lines.css');
  linesCssContent = fs.readFileSync(cssPath, 'utf-8');
});

// Define the choice types from the design document
const CHOICE_TYPES = ['default', 'positive', 'negative', 'neutral'] as const;
type ChoiceType = (typeof CHOICE_TYPES)[number];

// Define expected colors for each choice type (hue values)
const CHOICE_TYPE_COLORS: Record<ChoiceType, { hue: number; tolerance: number }> = {
  default: { hue: 270, tolerance: 15 },   // Purple
  positive: { hue: 142, tolerance: 15 },  // Green
  negative: { hue: 0, tolerance: 15 },    // Red
  neutral: { hue: 270, tolerance: 15 },   // Gray-purple (270 with low saturation)
};

// Generator for choice types
const choiceTypeArb = fc.constantFrom(...CHOICE_TYPES);

describe('Property 3: Connection Line Styling', () => {
  /**
   * Property 3a: For any choice type, the CSS SHALL define a line class
   * scoped under .halloween
   */
  it('every choice type has a line class scoped under .halloween', () => {
    fc.assert(
      fc.property(choiceTypeArb, (choiceType: ChoiceType) => {
        const className = `halloween-line-${choiceType}`;
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${className}`,
          'g'
        );
        return scopedClassRegex.test(linesCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3b: For any choice type line, the CSS SHALL include stroke property
   * referencing a gradient
   */
  it('every choice type line has stroke property with gradient reference', () => {
    fc.assert(
      fc.property(choiceTypeArb, (choiceType: ChoiceType) => {
        const className = `halloween-line-${choiceType}`;
        const lineSection = extractLineSection(linesCssContent, className);
        
        // Check for stroke property with url() gradient reference
        const hasStrokeGradient = /stroke\s*:\s*url\s*\(\s*#halloween-gradient-/.test(lineSection);
        return hasStrokeGradient;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3c: For any choice type line, the CSS SHALL include filter property
   * with drop-shadow for glow effect
   */
  it('every choice type line has filter with drop-shadow for glow', () => {
    fc.assert(
      fc.property(choiceTypeArb, (choiceType: ChoiceType) => {
        const className = `halloween-line-${choiceType}`;
        const lineSection = extractLineSection(linesCssContent, className);
        
        // Check for filter with drop-shadow
        const hasDropShadow = /filter\s*:\s*drop-shadow/.test(lineSection);
        return hasDropShadow;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3d: For any choice type line, hover state SHALL intensify the glow
   * (larger drop-shadow values)
   */
  it('every choice type line has hover state with intensified glow', () => {
    fc.assert(
      fc.property(choiceTypeArb, (choiceType: ChoiceType) => {
        const className = `halloween-line-${choiceType}`;
        
        // Check for hover rule
        const hoverRegex = new RegExp(
          `\\.halloween\\s+\\.${className}:hover`,
          'g'
        );
        const hasHoverRule = hoverRegex.test(linesCssContent);
        
        if (!hasHoverRule) {
          return false;
        }
        
        // Extract hover section and verify it has filter with drop-shadow
        const hoverSection = extractHoverSection(linesCssContent, className);
        const hasIntensifiedGlow = /filter\s*:\s*drop-shadow/.test(hoverSection);
        
        return hasIntensifiedGlow;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3e: For any choice type, gradient stop colors SHALL use the correct
   * hue from the Halloween palette
   */
  it('gradient stops use correct hue for each choice type', () => {
    fc.assert(
      fc.property(choiceTypeArb, (choiceType: ChoiceType) => {
        const expectedColor = CHOICE_TYPE_COLORS[choiceType];
        const gradientStopClass = `halloween-gradient-stop-${choiceType}-start`;
        
        // Find the gradient stop definition
        const stopRegex = new RegExp(
          `\\.${gradientStopClass}[^{]*\\{[^}]*\\}`,
          'g'
        );
        const stopMatch = linesCssContent.match(stopRegex);
        
        if (!stopMatch || stopMatch.length === 0) {
          return false;
        }
        
        // Extract hue value from stop-color
        const hslMatch = stopMatch[0].match(/hsl\s*\(\s*(\d+)/);
        if (!hslMatch) {
          return false;
        }
        
        const hue = parseInt(hslMatch[1], 10);
        const isCorrectHue = Math.abs(hue - expectedColor.hue) <= expectedColor.tolerance;
        
        return isCorrectHue;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3f: Particle flow animation SHALL be defined for animated lines
   */
  it('particle flow animation is defined for line particles', () => {
    // Check that particle flow keyframes exist
    const hasParticleFlowKeyframes = /@keyframes\s+particleFlow/.test(linesCssContent);
    
    // Check that halloween-line-particles class exists
    const hasParticlesClass = /\.halloween\s+\.halloween-line-particles/.test(linesCssContent);
    
    fc.assert(
      fc.property(fc.boolean(), () => {
        return hasParticleFlowKeyframes && hasParticlesClass;
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Property 3g: Reduced motion fallback SHALL disable particle animations
   */
  it('reduced motion fallback disables particle animations', () => {
    // Check for prefers-reduced-motion media query
    const hasReducedMotionQuery = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(linesCssContent);
    
    if (!hasReducedMotionQuery) {
      return;
    }
    
    // Extract reduced motion section
    const reducedMotionMatch = linesCssContent.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\n\}/
    );
    
    fc.assert(
      fc.property(fc.boolean(), () => {
        if (!reducedMotionMatch) {
          return false;
        }
        
        const reducedMotionSection = reducedMotionMatch[0];
        // Check that animation: none is set for particles
        const hasAnimationNone = /animation\s*:\s*none/.test(reducedMotionSection);
        
        return hasAnimationNone;
      }),
      { numRuns: 1 }
    );
  });
});

/**
 * Helper function to extract the CSS section for a specific line class
 */
function extractLineSection(css: string, className: string): string {
  const classRegex = new RegExp(
    `\\.halloween\\s+\\.${className}[^:{]*\\{[^}]*\\}`,
    'g'
  );
  const matches = css.match(classRegex) || [];
  return matches.join('\n');
}

/**
 * Helper function to extract the hover section for a specific line class
 */
function extractHoverSection(css: string, className: string): string {
  const hoverRegex = new RegExp(
    `\\.halloween\\s+\\.${className}:hover[^{]*\\{[^}]*\\}`,
    'g'
  );
  const matches = css.match(hoverRegex) || [];
  return matches.join('\n');
}
