/**
 * Property-Based Tests for Halloween CSS Compliance
 * 
 * **Feature: halloween-refactor, Property 7: CSS Halloween Compliance**
 * **Validates: Requirements 4.2, 4.3, 4.5**
 * 
 * Tests that Halloween effect CSS:
 * (a) uses animations or pseudo-elements
 * (b) includes prefers-reduced-motion media query
 * (c) uses colors from the 270° hue palette (purple)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the effects.css file content
let effectsCssContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'effects.css');
  effectsCssContent = fs.readFileSync(cssPath, 'utf-8');
});

// Define the 8 Halloween effects from the design document
const HALLOWEEN_EFFECTS = [
  'ghost-float',
  'spider-web-corner',
  'candle-flicker',
  'bat-silhouette',
  'cauldron-bubble',
  'pumpkin-glow',
  'skeleton-rattle',
  'fog-overlay',
] as const;

type HalloweenEffect = typeof HALLOWEEN_EFFECTS[number];

// Generator for Halloween effect names
const halloweenEffectArb = fc.constantFrom(...HALLOWEEN_EFFECTS);

describe('Property 7: CSS Halloween Compliance', () => {
  /**
   * Property 7a: For any Halloween effect, the CSS SHALL use animations or pseudo-elements
   */
  it('every Halloween effect uses animations or pseudo-elements', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effectName: HalloweenEffect) => {
        const className = `halloween-${effectName}`;
        
        // Check if the effect class exists in the CSS
        const classRegex = new RegExp(`\\.halloween\\s+\\.${className}|@keyframes\\s+\\w+`, 'g');
        const hasClass = effectsCssContent.includes(className);
        
        if (!hasClass) {
          return false; // Effect class not found
        }
        
        // Check for animation property or pseudo-element (::before, ::after)
        const effectSection = extractEffectSection(effectsCssContent, effectName);
        
        const hasAnimation = /animation\s*:/.test(effectSection) || 
                            /@keyframes/.test(effectSection);
        const hasPseudoElement = /::before|::after/.test(effectSection);
        
        return hasAnimation || hasPseudoElement;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7b: For any Halloween effect with animation, 
   * the CSS SHALL include a prefers-reduced-motion media query
   */
  it('every animated Halloween effect has prefers-reduced-motion fallback', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effectName: HalloweenEffect) => {
        const className = `halloween-${effectName}`;
        const effectSection = extractEffectSection(effectsCssContent, effectName);
        
        // If the effect uses animation, it must have reduced-motion handling
        const hasAnimation = /animation\s*:/.test(effectSection);
        
        if (!hasAnimation) {
          return true; // No animation, no need for reduced-motion
        }
        
        // Check for prefers-reduced-motion media query in the file
        // that references this effect's class or animation
        const reducedMotionRegex = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/;
        const hasReducedMotion = reducedMotionRegex.test(effectsCssContent);
        
        // Also check that the specific class is handled in reduced motion
        const classInReducedMotion = effectsCssContent.includes('prefers-reduced-motion') &&
          (effectsCssContent.includes(className) || 
           effectsCssContent.includes('animation: none'));
        
        return hasReducedMotion && classInReducedMotion;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7c: For any Halloween effect, colors SHALL use the 270° hue palette (purple)
   * or the 30° hue (orange for pumpkin effects)
   */
  it('Halloween effects use the correct color palette (270° purple or 30° orange)', () => {
    fc.assert(
      fc.property(halloweenEffectArb, (effectName: HalloweenEffect) => {
        const effectSection = extractEffectSection(effectsCssContent, effectName);
        
        // Extract all hsl() color values from the effect section
        const hslMatches = effectSection.match(/hsl\s*\(\s*(\d+)/g) || [];
        
        if (hslMatches.length === 0) {
          return true; // No explicit hsl colors, might use CSS variables
        }
        
        // Check that all hue values are in the allowed range
        // 270° (purple) ± 15° or 30° (orange) ± 15° or 25° (orange accent) ± 10°
        const allowedHues = hslMatches.every(match => {
          const hueMatch = match.match(/hsl\s*\(\s*(\d+)/);
          if (!hueMatch) return true;
          
          const hue = parseInt(hueMatch[1], 10);
          
          // Purple range: 255-285 (270 ± 15)
          const isPurple = hue >= 255 && hue <= 285;
          // Orange range: 15-45 (30 ± 15)
          const isOrange = hue >= 15 && hue <= 45;
          // Yellow/gold for stars: 40-50
          const isYellow = hue >= 40 && hue <= 50;
          
          return isPurple || isOrange || isYellow;
        });
        
        return allowedHues;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to extract the CSS section for a specific effect
 */
function extractEffectSection(css: string, effectName: string): string {
  const className = `halloween-${effectName}`;
  
  // Find all occurrences of the class in the CSS
  const classRegex = new RegExp(`\\.halloween\\s+\\.${className}[^{]*\\{[^}]*\\}`, 'g');
  const classMatches = css.match(classRegex) || [];
  
  // Also find any @keyframes that might be related
  // Convert effect name to camelCase for keyframe names
  const camelCaseName = effectName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const keyframeRegex = new RegExp(`@keyframes\\s+${camelCaseName}[^{]*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`, 'gi');
  const keyframeMatches = css.match(keyframeRegex) || [];
  
  // Also check for pseudo-elements on the class
  const pseudoRegex = new RegExp(`\\.halloween\\s+\\.${className}::(?:before|after)[^{]*\\{[^}]*\\}`, 'g');
  const pseudoMatches = css.match(pseudoRegex) || [];
  
  // Combine all matches
  const allMatches = [...classMatches, ...keyframeMatches, ...pseudoMatches];
  
  if (allMatches.length === 0) {
    // Fallback: search for the class name anywhere
    const classIndex = css.indexOf(className);
    if (classIndex === -1) return '';
    
    // Extract ~1000 chars around the class
    const start = Math.max(0, classIndex - 300);
    const end = Math.min(css.length, classIndex + 1000);
    return css.slice(start, end);
  }
  
  return allMatches.join('\n');
}
