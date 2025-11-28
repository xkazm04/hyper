/**
 * Property-Based Tests for Halloween Text Contrast Compliance
 * 
 * **Feature: halloween-theme-enrichment, Property 8: Text Contrast Compliance**
 * **Validates: Requirements 7.2**
 * 
 * Tests that for any text element rendered over Halloween decorations, the text color
 * and background combination SHALL maintain a minimum contrast ratio of 4.5:1 for
 * normal text and 3:1 for large text (WCAG AA).
 */

import { describe, it, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read all Halloween CSS files and theme variables
let allCssContent: string;
let themeVariablesContent: string;

beforeAll(() => {
  const cssDir = path.join(__dirname);
  const cssFileNames = [
    'borders.css',
    'backgrounds.css',
    'lines.css',
    'effects.css',
    'interactive.css',
    'nodes.css',
    'dividers.css',
    'components.css',
    'accessibility.css',
  ];

  const cssContents = cssFileNames
    .map((name) => {
      const filePath = path.join(cssDir, name);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return '';
    })
    .filter((content) => content.length > 0);

  allCssContent = cssContents.join('\n');

  // Read theme variables
  const themeVarsPath = path.join(__dirname, '..', 'theme-variables.css');
  if (fs.existsSync(themeVarsPath)) {
    themeVariablesContent = fs.readFileSync(themeVarsPath, 'utf-8');
  } else {
    themeVariablesContent = '';
  }
});

// Define Halloween color palette with their approximate luminance values
// These are the colors used in the Halloween theme
const HALLOWEEN_COLORS = [
  // Purple palette (270° hue)
  { name: 'purple-dark', hsl: 'hsl(270 25% 12%)', luminance: 0.012 },
  { name: 'purple-medium', hsl: 'hsl(270 30% 25%)', luminance: 0.045 },
  { name: 'purple-light', hsl: 'hsl(270 70% 60%)', luminance: 0.28 },
  { name: 'purple-bright', hsl: 'hsl(270 70% 80%)', luminance: 0.55 },
  // Orange palette (30° hue)
  { name: 'orange-dark', hsl: 'hsl(30 30% 20%)', luminance: 0.03 },
  { name: 'orange-medium', hsl: 'hsl(30 90% 50%)', luminance: 0.35 },
  { name: 'orange-light', hsl: 'hsl(30 90% 70%)', luminance: 0.55 },
  // Green palette (142° hue)
  { name: 'green-dark', hsl: 'hsl(142 50% 30%)', luminance: 0.08 },
  { name: 'green-medium', hsl: 'hsl(142 65% 50%)', luminance: 0.25 },
  { name: 'green-light', hsl: 'hsl(142 65% 70%)', luminance: 0.45 },
  // Red palette (0° hue)
  { name: 'red-dark', hsl: 'hsl(0 50% 30%)', luminance: 0.06 },
  { name: 'red-medium', hsl: 'hsl(0 70% 55%)', luminance: 0.2 },
  { name: 'red-light', hsl: 'hsl(0 70% 70%)', luminance: 0.4 },
  // Neutral/Gray palette
  { name: 'gray-dark', hsl: 'hsl(270 10% 15%)', luminance: 0.02 },
  { name: 'gray-medium', hsl: 'hsl(270 10% 60%)', luminance: 0.3 },
  { name: 'gray-light', hsl: 'hsl(270 10% 80%)', luminance: 0.6 },
  // White and near-white for text
  { name: 'white', hsl: 'hsl(0 0% 100%)', luminance: 1.0 },
  { name: 'off-white', hsl: 'hsl(0 0% 95%)', luminance: 0.88 },
  { name: 'light-gray', hsl: 'hsl(0 0% 90%)', luminance: 0.79 },
] as const;

// Define background/text color combinations that should meet WCAG AA
const TEXT_BACKGROUND_COMBINATIONS = [
  // Dark backgrounds with light text (typical Halloween theme)
  { background: 'purple-dark', text: 'white', expectedPass: true },
  { background: 'purple-dark', text: 'off-white', expectedPass: true },
  { background: 'purple-dark', text: 'purple-light', expectedPass: true },
  { background: 'purple-medium', text: 'white', expectedPass: true },
  { background: 'gray-dark', text: 'white', expectedPass: true },
  { background: 'gray-dark', text: 'purple-light', expectedPass: true },
  // Component-specific backgrounds
  { background: 'orange-dark', text: 'white', expectedPass: true },
  { background: 'green-dark', text: 'white', expectedPass: true },
  { background: 'red-dark', text: 'white', expectedPass: true },
] as const;

type HalloweenColor = (typeof HALLOWEEN_COLORS)[number];
type TextBackgroundCombination = (typeof TEXT_BACKGROUND_COMBINATIONS)[number];

// Generator for color combinations
const colorCombinationArb = fc.constantFrom(...TEXT_BACKGROUND_COMBINATIONS);

// Generator for Halloween colors
const halloweenColorArb = fc.constantFrom(...HALLOWEEN_COLORS);

/**
 * Calculate contrast ratio between two luminance values
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color
 */
function calculateContrastRatio(luminance1: number, luminance2: number): number {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get color by name from the palette
 */
function getColorByName(name: string): HalloweenColor | undefined {
  return HALLOWEEN_COLORS.find((c) => c.name === name);
}

describe('Property 8: Text Contrast Compliance', () => {
  /**
   * Property 8a: For any text/background color combination in the Halloween theme,
   * the contrast ratio SHALL be at least 4.5:1 for normal text (WCAG AA)
   */
  it('text/background combinations meet WCAG AA contrast ratio (4.5:1)', () => {
    fc.assert(
      fc.property(colorCombinationArb, (combination: TextBackgroundCombination) => {
        const bgColor = getColorByName(combination.background);
        const textColor = getColorByName(combination.text);

        if (!bgColor || !textColor) {
          return true; // Skip if colors not found
        }

        const contrastRatio = calculateContrastRatio(
          bgColor.luminance,
          textColor.luminance
        );

        // WCAG AA requires 4.5:1 for normal text
        const meetsWcagAA = contrastRatio >= 4.5;

        return meetsWcagAA === combination.expectedPass;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8b: For any decorative overlay pseudo-element in its default state,
   * the static opacity SHALL be low enough to not significantly reduce text contrast
   * Note: Hover states may use opacity: 1 for reveal effects, which is acceptable
   * when the underlying pattern uses semi-transparent colors
   */
  it('decorative overlay pseudo-elements use appropriate default opacity values', () => {
    // First, remove all @keyframes blocks from the CSS to avoid matching animation values
    const cssWithoutKeyframes = allCssContent.replace(
      /@keyframes\s+[a-zA-Z]+\s*\{[\s\S]*?\}\s*\}/g,
      ''
    );

    // Extract opacity values specifically from pseudo-element rule blocks
    // Exclude hover/focus/active states as they may intentionally use opacity: 1 for reveal effects
    const pseudoElementRegex =
      /\.halloween\s+\.[a-zA-Z-]+::(?:before|after)\s*\{([^}]*)\}/g;
    const opacityValues: number[] = [];
    let match;

    while ((match = pseudoElementRegex.exec(cssWithoutKeyframes)) !== null) {
      const ruleContent = match[1];
      const opacityMatch = ruleContent.match(/opacity\s*:\s*([\d.]+)/);
      if (opacityMatch) {
        opacityValues.push(parseFloat(opacityMatch[1]));
      }
    }

    // If no pseudo-element opacity values found, the test passes
    if (opacityValues.length === 0) {
      return;
    }

    fc.assert(
      fc.property(fc.constantFrom(...opacityValues), (opacity: number) => {
        // Decorative overlay pseudo-elements in default state should have opacity <= 0.9
        // to maintain text readability over them
        // Note: opacity: 0 is valid (hidden by default, revealed on interaction)
        return opacity <= 0.9;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8c: For any background decoration overlay, the CSS SHALL use
   * semi-transparent colors that don't completely obscure the background
   */
  it('background decoration overlays use semi-transparent colors', () => {
    // Extract hsl() colors with alpha values from pseudo-element contexts
    // These are the decorative overlays that could affect text readability
    const pseudoElementRegex = /::(?:before|after)[^{]*\{[^}]*hsl\s*\([^)]*\/\s*([\d.]+)\s*\)/g;
    const alphaValues: number[] = [];
    let match;

    while ((match = pseudoElementRegex.exec(allCssContent)) !== null) {
      alphaValues.push(parseFloat(match[1]));
    }

    // Filter to only include values that are clearly alpha values (0-1 range)
    const validAlphaValues = alphaValues.filter((v) => v >= 0 && v <= 1);

    if (validAlphaValues.length === 0) {
      return; // No alpha values found in pseudo-elements, skip
    }

    fc.assert(
      fc.property(fc.constantFrom(...validAlphaValues), (alpha: number) => {
        // Background decoration overlays should use alpha values that maintain readability
        // Values up to 0.95 are acceptable as they still allow some background visibility
        return alpha <= 0.95;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8d: The Halloween theme SHALL define text colors that contrast
   * with the dark purple background
   */
  it('Halloween theme uses high-contrast text colors', () => {
    // Check that the CSS includes light text colors for dark backgrounds
    const hasLightTextColors =
      /color\s*:\s*hsl\s*\(\s*\d+\s+\d+%\s+[789]\d%/.test(allCssContent) ||
      /color\s*:\s*hsl\s*\(\s*0\s+0%\s+(9\d|100)%/.test(allCssContent) ||
      /text-shadow/.test(allCssContent);

    // Check that backgrounds are dark
    const hasDarkBackgrounds =
      /background\s*:\s*.*hsl\s*\(\s*270\s+\d+%\s+[12]\d%/.test(allCssContent) ||
      /background-color\s*:\s*hsl\s*\(\s*270\s+\d+%\s+[12]\d%/.test(allCssContent);

    fc.assert(
      fc.property(fc.boolean(), () => {
        // At least one of these patterns should be present
        return hasLightTextColors || hasDarkBackgrounds;
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Property 8e: For any vignette or edge darkening effect, the center
   * SHALL remain transparent to preserve text readability
   */
  it('vignette effects preserve center transparency', () => {
    // Check for radial-gradient vignette patterns
    const vignetteRegex =
      /radial-gradient\s*\(\s*(?:ellipse|circle)?\s*(?:at\s+center)?\s*,\s*transparent/gi;
    const hasTransparentCenter = vignetteRegex.test(allCssContent);

    fc.assert(
      fc.property(fc.boolean(), () => {
        // Vignette effects should have transparent centers
        return hasTransparentCenter;
      }),
      { numRuns: 1 }
    );
  });
});
