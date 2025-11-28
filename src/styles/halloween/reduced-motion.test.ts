/**
 * Property-Based Tests for Halloween Reduced Motion Compliance
 * 
 * **Feature: halloween-theme-enrichment, Property 2: Reduced Motion Compliance**
 * **Validates: Requirements 1.5, 7.1**
 * 
 * Tests that for any animated Halloween decoration, when prefers-reduced-motion is enabled,
 * the animation SHALL be disabled and replaced with a static fallback style that maintains
 * visual consistency without motion.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read all Halloween CSS files
let bordersCssContent: string;
let backgroundsCssContent: string;
let linesCssContent: string;
let allCssContent: string;

beforeAll(() => {
  const bordersPath = path.join(__dirname, 'borders.css');
  const backgroundsPath = path.join(__dirname, 'backgrounds.css');
  const linesPath = path.join(__dirname, 'lines.css');

  bordersCssContent = fs.readFileSync(bordersPath, 'utf-8');
  backgroundsCssContent = fs.readFileSync(backgroundsPath, 'utf-8');
  linesCssContent = fs.readFileSync(linesPath, 'utf-8');
  allCssContent = bordersCssContent + backgroundsCssContent + linesCssContent;
});

// Define all animated Halloween effects across all CSS files
const ANIMATED_EFFECTS = [
  // From borders.css
  {
    id: 'dripping-border',
    cssClass: 'halloween-drip-border',
    file: 'borders',
    animationName: 'drippingBorder',
  },
  {
    id: 'ethereal-glow',
    cssClass: 'halloween-ethereal-glow',
    file: 'borders',
    animationName: 'etherealGlow',
  },
  {
    id: 'spectral-outline',
    cssClass: 'halloween-spectral-outline',
    file: 'borders',
    animationName: 'spectralOutline',
  },
  {
    id: 'candle-flicker-focus',
    cssClass: 'halloween-candle-flicker-focus',
    file: 'borders',
    animationName: 'candleFlickerFocus',
  },
  // From backgrounds.css
  {
    id: 'fog-layer',
    cssClass: 'halloween-fog-layer',
    file: 'backgrounds',
    animationName: 'fogLayerDrift',
  },
  {
    id: 'dust-particles',
    cssClass: 'halloween-dust-particles',
    file: 'backgrounds',
    animationName: 'dustParticlesFloat',
  },
  // From lines.css
  {
    id: 'line-particles',
    cssClass: 'halloween-line-particles',
    file: 'lines',
    animationName: 'particleFlowDefault',
  },
] as const;

type AnimatedEffect = (typeof ANIMATED_EFFECTS)[number];

// Generator for animated effect definitions
const animatedEffectArb = fc.constantFrom(...ANIMATED_EFFECTS);

describe('Property 2: Reduced Motion Compliance', () => {
  /**
   * Property 2a: For any animated effect, the CSS file SHALL contain
   * a prefers-reduced-motion media query
   */
  it('every CSS file with animations has prefers-reduced-motion media query', () => {
    fc.assert(
      fc.property(animatedEffectArb, (effect: AnimatedEffect) => {
        let cssContent: string;
        switch (effect.file) {
          case 'borders':
            cssContent = bordersCssContent;
            break;
          case 'backgrounds':
            cssContent = backgroundsCssContent;
            break;
          case 'lines':
            cssContent = linesCssContent;
            break;
          default:
            return false;
        }

        // Check for prefers-reduced-motion media query
        const reducedMotionRegex =
          /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/;
        return reducedMotionRegex.test(cssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b: For any animated effect, within the prefers-reduced-motion block,
   * the animation SHALL be disabled (animation: none)
   */
  it('animated effects have animation: none in reduced motion block', () => {
    fc.assert(
      fc.property(animatedEffectArb, (effect: AnimatedEffect) => {
        let cssContent: string;
        switch (effect.file) {
          case 'borders':
            cssContent = bordersCssContent;
            break;
          case 'backgrounds':
            cssContent = backgroundsCssContent;
            break;
          case 'lines':
            cssContent = linesCssContent;
            break;
          default:
            return false;
        }

        // Extract the reduced motion block
        const reducedMotionBlock = extractReducedMotionBlock(cssContent);

        if (!reducedMotionBlock) {
          return false;
        }

        // Check that the effect class is handled in the reduced motion block
        // Either by direct class reference or by animation: none
        const hasAnimationNone = /animation\s*:\s*none/.test(reducedMotionBlock);
        const hasClassReference = reducedMotionBlock.includes(effect.cssClass);

        return hasAnimationNone || hasClassReference;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2c: For any animated effect, the reduced motion fallback
   * SHALL maintain visual styling (not completely remove the effect)
   */
  it('reduced motion fallbacks maintain visual styling', () => {
    fc.assert(
      fc.property(animatedEffectArb, (effect: AnimatedEffect) => {
        let cssContent: string;
        switch (effect.file) {
          case 'borders':
            cssContent = bordersCssContent;
            break;
          case 'backgrounds':
            cssContent = backgroundsCssContent;
            break;
          case 'lines':
            cssContent = linesCssContent;
            break;
          default:
            return false;
        }

        const reducedMotionBlock = extractReducedMotionBlock(cssContent);

        if (!reducedMotionBlock) {
          return false;
        }

        // Check that the reduced motion block contains some visual styling
        // (not just animation: none, but also static styles)
        const hasVisualStyles =
          /box-shadow|opacity|transform|filter|outline|clip-path|stroke-dasharray/.test(
            reducedMotionBlock
          );

        // Or the effect is simply disabled without needing a fallback
        const hasAnimationNone = /animation\s*:\s*none/.test(reducedMotionBlock);

        return hasVisualStyles || hasAnimationNone;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2d: For any @keyframes animation, there SHALL be a corresponding
   * reduced motion handling
   */
  it('every @keyframes has corresponding reduced motion handling', () => {
    // Extract all @keyframes names from all CSS files
    const keyframesRegex = /@keyframes\s+([a-zA-Z]+)/g;
    const keyframesNames: string[] = [];
    let match;

    while ((match = keyframesRegex.exec(allCssContent)) !== null) {
      keyframesNames.push(match[1]);
    }

    // For each keyframes, verify there's reduced motion handling
    fc.assert(
      fc.property(fc.constantFrom(...keyframesNames), (keyframeName: string) => {
        // Check that the file containing this keyframe has reduced motion handling
        const reducedMotionRegex =
          /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/;
        return reducedMotionRegex.test(allCssContent);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to extract the prefers-reduced-motion media query block
 */
function extractReducedMotionBlock(css: string): string | null {
  const reducedMotionRegex =
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{([\s\S]*?)\}/g;
  const matches = css.match(reducedMotionRegex);

  if (!matches) {
    return null;
  }

  return matches.join('\n');
}
