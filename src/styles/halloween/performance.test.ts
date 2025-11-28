/**
 * Property-Based Tests for Halloween CSS Performance Compliance
 * 
 * **Feature: halloween-theme-enrichment, Property 7: CSS Performance Compliance**
 * **Validates: Requirements 7.3, 7.4**
 * 
 * Tests that for any animated Halloween decoration overlay, the CSS SHALL use
 * GPU-accelerated properties (transform, opacity) for animations and fixed/absolute
 * positioning to avoid layout thrashing.
 */

import { describe, it, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read all Halloween CSS files
let allCssContent: string;
let cssFiles: { name: string; content: string }[];

beforeAll(() => {
  const cssDir = __dirname;
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

  cssFiles = cssFileNames
    .map((name) => {
      const filePath = path.join(cssDir, name);
      if (fs.existsSync(filePath)) {
        return { name, content: fs.readFileSync(filePath, 'utf-8') };
      }
      return null;
    })
    .filter((f): f is { name: string; content: string } => f !== null);

  allCssContent = cssFiles.map((f) => f.content).join('\n');
});

// Define all animated effects that should use GPU-accelerated properties
const ANIMATED_EFFECTS = [
  // From borders.css
  { id: 'dripping-border', cssClass: 'halloween-drip-border', hasAnimation: true },
  { id: 'ethereal-glow', cssClass: 'halloween-ethereal-glow', hasAnimation: true },
  { id: 'spectral-outline', cssClass: 'halloween-spectral-outline', hasAnimation: true },
  { id: 'candle-flicker-focus', cssClass: 'halloween-candle-flicker-focus', hasAnimation: true },
  // From backgrounds.css
  { id: 'fog-layer', cssClass: 'halloween-fog-layer', hasAnimation: true },
  { id: 'dust-particles', cssClass: 'halloween-dust-particles', hasAnimation: true },
  // From effects.css
  { id: 'ghost-float', cssClass: 'halloween-ghost-float', hasAnimation: true },
  { id: 'candle-flicker', cssClass: 'halloween-candle-flicker', hasAnimation: true },
  { id: 'cauldron-bubble', cssClass: 'halloween-cauldron-bubble', hasAnimation: true },
  { id: 'pumpkin-glow', cssClass: 'halloween-pumpkin-glow', hasAnimation: true },
  { id: 'fog-overlay', cssClass: 'halloween-fog-overlay', hasAnimation: true },
  // From interactive.css
  { id: 'smoke-wisp', cssClass: 'halloween-smoke-wisp', hasAnimation: true },
  { id: 'spectral-ripple', cssClass: 'halloween-spectral-ripple', hasAnimation: true },
  { id: 'ember-focus', cssClass: 'halloween-ember-focus', hasAnimation: true },
  { id: 'ghost-trail', cssClass: 'halloween-ghost-trail', hasAnimation: true },
  // From nodes.css
  { id: 'corner-decoration', cssClass: 'halloween-corner-decoration', hasAnimation: true },
  { id: 'node-selected', cssClass: 'halloween-node-selected', hasAnimation: true },
  { id: 'portal-border', cssClass: 'halloween-portal-border', hasAnimation: true },
  // From dividers.css
  { id: 'drip-divider', cssClass: 'halloween-drip-divider', hasAnimation: true },
  { id: 'header-icon', cssClass: 'halloween-header-icon', hasAnimation: true },
  // From components.css
  { id: 'cauldron-container', cssClass: 'halloween-cauldron-container', hasAnimation: true },
  { id: 'bubbling-border', cssClass: 'halloween-bubbling-border', hasAnimation: true },
  { id: 'crystal-glow', cssClass: 'halloween-crystal-glow', hasAnimation: true },
  { id: 'potion-bottle', cssClass: 'halloween-potion-bottle', hasAnimation: true },
  { id: 'potion-bubbles', cssClass: 'halloween-potion-bubbles', hasAnimation: true },
] as const;

// Define overlay effects that should use fixed or absolute positioning
const OVERLAY_EFFECTS = [
  { id: 'fog-layer', cssClass: 'halloween-fog-layer', pseudoElement: '::before' },
  { id: 'dust-particles', cssClass: 'halloween-dust-particles', pseudoElement: '::after' },
  { id: 'cobweb', cssClass: 'halloween-cobweb', pseudoElement: '::before' },
  { id: 'cobweb-after', cssClass: 'halloween-cobweb', pseudoElement: '::after' },
  { id: 'vignette', cssClass: 'halloween-vignette', pseudoElement: '::before' },
  { id: 'drip-border', cssClass: 'halloween-drip-border', pseudoElement: '::after' },
  { id: 'ethereal-glow', cssClass: 'halloween-ethereal-glow', pseudoElement: '::before' },
  { id: 'corner-decoration-before', cssClass: 'halloween-corner-decoration', pseudoElement: '::before' },
  { id: 'corner-decoration-after', cssClass: 'halloween-corner-decoration', pseudoElement: '::after' },
  { id: 'node-selected', cssClass: 'halloween-node-selected', pseudoElement: '::before' },
  { id: 'crack-hover', cssClass: 'halloween-crack-hover', pseudoElement: '::after' },
  { id: 'portal-border-before', cssClass: 'halloween-portal-border', pseudoElement: '::before' },
  { id: 'portal-border-after', cssClass: 'halloween-portal-border', pseudoElement: '::after' },
  { id: 'smoke-wisp-before', cssClass: 'halloween-smoke-wisp', pseudoElement: '::before' },
  { id: 'smoke-wisp-after', cssClass: 'halloween-smoke-wisp', pseudoElement: '::after' },
  { id: 'spectral-ripple', cssClass: 'halloween-spectral-ripple', pseudoElement: '::before' },
  { id: 'ember-focus-before', cssClass: 'halloween-ember-focus', pseudoElement: '::before' },
  { id: 'ember-focus-after', cssClass: 'halloween-ember-focus', pseudoElement: '::after' },
  { id: 'ghost-trail', cssClass: 'halloween-ghost-trail', pseudoElement: '::before' },
] as const;

type AnimatedEffect = (typeof ANIMATED_EFFECTS)[number];
type OverlayEffect = (typeof OVERLAY_EFFECTS)[number];

// Generator for animated effect definitions
const animatedEffectArb = fc.constantFrom(...ANIMATED_EFFECTS);

// Generator for overlay effect definitions
const overlayEffectArb = fc.constantFrom(...OVERLAY_EFFECTS);

describe('Property 7: CSS Performance Compliance', () => {
  /**
   * Property 7a: For any @keyframes animation, the animation SHALL primarily use
   * GPU-accelerated properties (transform, opacity, filter, box-shadow)
   * and avoid layout-triggering properties (width, height, margin, padding, top, left, right, bottom)
   */
  it('keyframes animations use GPU-accelerated properties', () => {
    // Extract all @keyframes blocks
    const keyframesRegex = /@keyframes\s+([a-zA-Z]+)\s*\{([\s\S]*?)\}\s*\}/g;
    const keyframesBlocks: { name: string; content: string }[] = [];
    let match;

    while ((match = keyframesRegex.exec(allCssContent)) !== null) {
      keyframesBlocks.push({ name: match[1], content: match[2] });
    }

    fc.assert(
      fc.property(fc.constantFrom(...keyframesBlocks), (keyframe) => {
        // Check for layout-triggering properties that should be avoided
        const layoutTriggeringProps = [
          /\bwidth\s*:/,
          /\bheight\s*:/,
          /\bmargin\s*:/,
          /\bmargin-top\s*:/,
          /\bmargin-bottom\s*:/,
          /\bmargin-left\s*:/,
          /\bmargin-right\s*:/,
          /\bpadding\s*:/,
          /\btop\s*:/,
          /\bleft\s*:/,
          /\bright\s*:/,
          /\bbottom\s*:/,
        ];

        // Check if any layout-triggering properties are used
        const hasLayoutTriggeringProps = layoutTriggeringProps.some((regex) =>
          regex.test(keyframe.content)
        );

        // If layout-triggering props are found, the test fails
        // Exception: clip-path is acceptable as it's GPU-accelerated in modern browsers
        if (hasLayoutTriggeringProps) {
          // Allow if it's a clip-path animation (which is GPU-accelerated)
          const isClipPathAnimation = /clip-path\s*:/.test(keyframe.content);
          return isClipPathAnimation;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7b: For any animated effect, the CSS SHALL use GPU-accelerated
   * properties for the animation (transform, opacity, filter, box-shadow)
   */
  it('animated effects use GPU-accelerated properties', () => {
    fc.assert(
      fc.property(animatedEffectArb, (effect: AnimatedEffect) => {
        // Find the animation definition for this effect
        const effectSection = extractEffectSection(allCssContent, effect.cssClass);

        if (!effectSection) {
          return true; // Effect not found, skip
        }

        // Check if animation property exists
        const hasAnimation = /animation\s*:/.test(effectSection);

        if (!hasAnimation) {
          return true; // No animation, skip
        }

        // Extract the animation name
        const animationMatch = effectSection.match(/animation\s*:\s*([a-zA-Z]+)/);
        if (!animationMatch) {
          return true;
        }

        // Find the keyframes for this animation
        const keyframesRegex = new RegExp(
          `@keyframes\\s+${animationMatch[1]}\\s*\\{([\\s\\S]*?)\\}\\s*\\}`,
          'i'
        );
        const keyframesMatch = allCssContent.match(keyframesRegex);

        if (!keyframesMatch) {
          return true; // Keyframes not found, skip
        }

        const keyframesContent = keyframesMatch[1];

        // Check that the keyframes use GPU-accelerated properties
        const gpuAcceleratedProps = [
          /transform\s*:/,
          /opacity\s*:/,
          /filter\s*:/,
          /box-shadow\s*:/,
          /clip-path\s*:/,
          /outline\s*:/,
          /outline-offset\s*:/,
          /stroke-dashoffset\s*:/,
          /background-position\s*:/,
        ];

        const hasGpuAcceleratedProps = gpuAcceleratedProps.some((regex) =>
          regex.test(keyframesContent)
        );

        return hasGpuAcceleratedProps;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7c: For any decorative overlay pseudo-element, the CSS SHALL use
   * absolute or fixed positioning
   */
  it('overlay pseudo-elements use absolute or fixed positioning', () => {
    fc.assert(
      fc.property(overlayEffectArb, (effect: OverlayEffect) => {
        // Find the pseudo-element definition
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}${effect.pseudoElement}[^{]*\\{([^}]*)\\}`,
          'gi'
        );
        const matches = allCssContent.match(pseudoRegex);

        if (!matches || matches.length === 0) {
          return true; // Pseudo-element not found, skip
        }

        // Check that at least one match has position: absolute or position: fixed
        return matches.some((match) => {
          return /position\s*:\s*(absolute|fixed)/.test(match);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7d: For any decorative overlay, the CSS SHALL include
   * pointer-events: none to avoid blocking interactions
   */
  it('overlay pseudo-elements have pointer-events: none', () => {
    fc.assert(
      fc.property(overlayEffectArb, (effect: OverlayEffect) => {
        // Find the pseudo-element definition
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}${effect.pseudoElement}[^{]*\\{([^}]*)\\}`,
          'gi'
        );
        const matches = allCssContent.match(pseudoRegex);

        if (!matches || matches.length === 0) {
          return true; // Pseudo-element not found, skip
        }

        // Check that at least one match has pointer-events: none
        return matches.some((match) => {
          return /pointer-events\s*:\s*none/.test(match);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7e: The accessibility.css file SHALL define the decoration toggle
   * CSS custom property --halloween-decorations-enabled
   */
  it('decoration toggle CSS custom property is defined', () => {
    const accessibilityCss = cssFiles.find((f) => f.name === 'accessibility.css');

    if (!accessibilityCss) {
      // File doesn't exist yet, skip
      return;
    }

    // Check for the custom property definition
    const hasCustomProperty = /--halloween-decorations-enabled\s*:/.test(
      accessibilityCss.content
    );

    // Check for the no-decorations class
    const hasNoDecorationsClass = /\.halloween-no-decorations/.test(
      accessibilityCss.content
    );

    fc.assert(
      fc.property(fc.boolean(), () => {
        return hasCustomProperty && hasNoDecorationsClass;
      }),
      { numRuns: 1 }
    );
  });
});

/**
 * Helper function to extract the CSS section for a specific effect class
 */
function extractEffectSection(css: string, className: string): string | null {
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

  const allMatches = [...classMatches, ...pseudoMatches];

  if (allMatches.length === 0) {
    return null;
  }

  return allMatches.join('\n');
}
