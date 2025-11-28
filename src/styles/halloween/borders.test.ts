/**
 * Property-Based Tests for Halloween Border Effects
 * 
 * **Feature: halloween-theme-enrichment, Property 1: Border Effects Application**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * Tests that for any element with a Halloween border effect class (card, panel, input, node),
 * when the Halloween theme is active, the element SHALL have the appropriate border decoration
 * styles applied including pseudo-element content, box-shadow, or border-image properties.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the borders.css file content
let bordersCssContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'borders.css');
  bordersCssContent = fs.readFileSync(cssPath, 'utf-8');
});

// Define the border effects from the design document
const BORDER_EFFECTS = [
  {
    id: 'dripping-border',
    cssClass: 'halloween-drip-border',
    applicableTo: ['card', 'panel', 'node'],
    expectedFeatures: ['pseudo-element', 'animation'],
  },
  {
    id: 'ethereal-glow',
    cssClass: 'halloween-ethereal-glow',
    applicableTo: ['panel', 'sidebar', 'modal'],
    expectedFeatures: ['box-shadow', 'animation'],
  },
  {
    id: 'spectral-outline',
    cssClass: 'halloween-spectral-outline',
    applicableTo: ['node', 'card'],
    expectedFeatures: ['outline', 'animation'],
  },
  {
    id: 'candle-flicker-focus',
    cssClass: 'halloween-candle-flicker-focus',
    applicableTo: ['input'],
    expectedFeatures: ['box-shadow', 'animation'],
  },
] as const;

type BorderEffect = (typeof BORDER_EFFECTS)[number];

// Generator for border effect definitions
const borderEffectArb = fc.constantFrom(...BORDER_EFFECTS);

// Generator for element types
const elementTypeArb = fc.constantFrom('card', 'panel', 'input', 'node', 'sidebar', 'modal');

describe('Property 1: Border Effects Application', () => {
  /**
   * Property 1a: For any border effect, the CSS class SHALL exist in the stylesheet
   * scoped under .halloween
   */
  it('every border effect has a CSS class scoped under .halloween', () => {
    fc.assert(
      fc.property(borderEffectArb, (effect: BorderEffect) => {
        // Check that the class exists and is scoped under .halloween
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}|\\.halloween\\s*\\.${effect.cssClass}`,
          'g'
        );
        return scopedClassRegex.test(bordersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1b: For any border effect with animation, the CSS SHALL define
   * the corresponding @keyframes
   */
  it('every animated border effect has corresponding @keyframes defined', () => {
    fc.assert(
      fc.property(borderEffectArb, (effect: BorderEffect) => {
        if (!effect.expectedFeatures.includes('animation')) {
          return true; // No animation expected
        }

        // Extract the section for this effect
        const effectSection = extractEffectSection(bordersCssContent, effect.cssClass);

        // Check for animation property
        const hasAnimation = /animation\s*:/.test(effectSection);

        if (!hasAnimation) {
          return false;
        }

        // Extract animation name and verify @keyframes exists
        const animationMatch = effectSection.match(/animation\s*:\s*([a-zA-Z]+)/);
        if (!animationMatch) {
          return false;
        }

        const animationName = animationMatch[1];
        const keyframesRegex = new RegExp(`@keyframes\\s+${animationName}`, 'i');
        return keyframesRegex.test(bordersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1c: For any border effect expecting pseudo-elements,
   * the CSS SHALL define ::before or ::after pseudo-elements
   */
  it('border effects with pseudo-element feature have ::before or ::after defined', () => {
    fc.assert(
      fc.property(borderEffectArb, (effect: BorderEffect) => {
        if (!effect.expectedFeatures.includes('pseudo-element')) {
          return true; // No pseudo-element expected
        }

        // Check for pseudo-element definition
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}::(?:before|after)`,
          'g'
        );
        return pseudoRegex.test(bordersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1d: For any border effect expecting box-shadow,
   * the CSS SHALL include box-shadow property
   */
  it('border effects with box-shadow feature have box-shadow defined', () => {
    fc.assert(
      fc.property(borderEffectArb, (effect: BorderEffect) => {
        if (!effect.expectedFeatures.includes('box-shadow')) {
          return true; // No box-shadow expected
        }

        const effectSection = extractEffectSection(bordersCssContent, effect.cssClass);
        return /box-shadow\s*:/.test(effectSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1e: For any border effect expecting outline,
   * the CSS SHALL include outline property
   */
  it('border effects with outline feature have outline defined', () => {
    fc.assert(
      fc.property(borderEffectArb, (effect: BorderEffect) => {
        if (!effect.expectedFeatures.includes('outline')) {
          return true; // No outline expected
        }

        const effectSection = extractEffectSection(bordersCssContent, effect.cssClass);
        return /outline\s*:/.test(effectSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1f: For any border effect, colors SHALL use the 270° hue palette (purple)
   * or complementary Halloween colors (orange 30°)
   */
  it('border effects use the correct Halloween color palette', () => {
    fc.assert(
      fc.property(borderEffectArb, (effect: BorderEffect) => {
        const effectSection = extractEffectSection(bordersCssContent, effect.cssClass);

        // Extract all hsl() color values
        const hslMatches = effectSection.match(/hsl\s*\(\s*(\d+)/g) || [];

        if (hslMatches.length === 0) {
          return true; // No explicit hsl colors
        }

        // Check that all hue values are in the allowed range
        return hslMatches.every((match) => {
          const hueMatch = match.match(/hsl\s*\(\s*(\d+)/);
          if (!hueMatch) return true;

          const hue = parseInt(hueMatch[1], 10);

          // Purple range: 255-285 (270 ± 15)
          const isPurple = hue >= 255 && hue <= 285;
          // Orange range: 15-45 (30 ± 15)
          const isOrange = hue >= 15 && hue <= 45;

          return isPurple || isOrange;
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to extract the CSS section for a specific effect class
 */
function extractEffectSection(css: string, className: string): string {
  // Find all occurrences of the class in the CSS
  const classRegex = new RegExp(
    `\\.halloween\\s+\\.${className}[^{]*\\{[^}]*\\}`,
    'g'
  );
  const classMatches = css.match(classRegex) || [];

  // Also find pseudo-elements
  const pseudoRegex = new RegExp(
    `\\.halloween\\s+\\.${className}::(?:before|after)[^{]*\\{[^}]*\\}`,
    'g'
  );
  const pseudoMatches = css.match(pseudoRegex) || [];

  // Find related @keyframes by looking for animation names in the class
  const allMatches = [...classMatches, ...pseudoMatches];
  let keyframeContent = '';

  // Extract animation names and find their keyframes
  for (const match of allMatches) {
    const animMatch = match.match(/animation\s*:\s*([a-zA-Z]+)/);
    if (animMatch) {
      const keyframeRegex = new RegExp(
        `@keyframes\\s+${animMatch[1]}[^{]*\\{[\\s\\S]*?\\}\\s*\\}`,
        'gi'
      );
      const keyframeMatch = css.match(keyframeRegex);
      if (keyframeMatch) {
        keyframeContent += keyframeMatch.join('\n');
      }
    }
  }

  return [...allMatches, keyframeContent].join('\n');
}
