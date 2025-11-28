/**
 * Property-Based Tests for Halloween Interactive State Enhancements
 * 
 * **Feature: halloween-theme-enrichment, Property 6: Interactive Effect Feedback**
 * **Validates: Requirements 6.1, 6.3, 6.5**
 * 
 * Tests that for any interactive element (button, input, draggable node),
 * when the Halloween theme is active and the element receives interaction
 * (hover, focus, click, drag), the element SHALL display the appropriate
 * feedback effect without blocking pointer events on the element's clickable area.
 */

import { describe, it, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the interactive.css file content
let interactiveCssContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'interactive.css');
  interactiveCssContent = fs.readFileSync(cssPath, 'utf-8');
});

// Define the interactive effects from the design document
const INTERACTIVE_EFFECTS = [
  {
    id: 'smoke-wisp',
    cssClass: 'halloween-smoke-wisp',
    trigger: 'hover',
    expectedFeatures: ['pseudo-element', 'animation'],
    requirement: '6.1',
  },
  {
    id: 'spectral-ripple',
    cssClass: 'halloween-spectral-ripple',
    trigger: 'active',
    expectedFeatures: ['pseudo-element', 'animation'],
    requirement: '6.2',
  },
  {
    id: 'ember-focus',
    cssClass: 'halloween-ember-focus',
    trigger: 'focus',
    expectedFeatures: ['pseudo-element', 'animation', 'box-shadow'],
    requirement: '6.3',
  },
  {
    id: 'ghost-trail',
    cssClass: 'halloween-ghost-trail',
    trigger: 'drag',
    expectedFeatures: ['pseudo-element'],
    requirement: '6.4',
  },
] as const;

type InteractiveEffect = (typeof INTERACTIVE_EFFECTS)[number];

// Generator for interactive effect definitions
const interactiveEffectArb = fc.constantFrom(...INTERACTIVE_EFFECTS);

// Generator for interaction triggers
const triggerArb = fc.constantFrom('hover', 'focus', 'active', 'drag');

describe('Property 6: Interactive Effect Feedback', () => {
  /**
   * Property 6a: For any interactive effect, the CSS class SHALL exist in the stylesheet
   * scoped under .halloween
   */
  it('every interactive effect has a CSS class scoped under .halloween', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        // Check that the class exists and is scoped under .halloween
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}`,
          'g'
        );
        return scopedClassRegex.test(interactiveCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6b: For any interactive effect with animation, the CSS SHALL define
   * the corresponding @keyframes
   */
  it('every animated interactive effect has corresponding @keyframes defined', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (!effect.expectedFeatures.includes('animation')) {
          return true; // No animation expected
        }

        // Extract the section for this effect
        const effectSection = extractEffectSection(interactiveCssContent, effect.cssClass);

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
        return keyframesRegex.test(interactiveCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6c: For any interactive effect expecting pseudo-elements,
   * the CSS SHALL define ::before or ::after pseudo-elements
   */
  it('interactive effects with pseudo-element feature have ::before or ::after defined', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (!effect.expectedFeatures.includes('pseudo-element')) {
          return true; // No pseudo-element expected
        }

        // Check for pseudo-element definition
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}::(?:before|after)`,
          'g'
        );
        return pseudoRegex.test(interactiveCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6d: For any interactive effect with pseudo-elements,
   * pseudo-elements SHALL have pointer-events: none to preserve click targets
   */
  it('interactive effect pseudo-elements have pointer-events: none', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (!effect.expectedFeatures.includes('pseudo-element')) {
          return true; // No pseudo-element expected
        }

        const effectSection = extractEffectSection(interactiveCssContent, effect.cssClass);
        return /pointer-events\s*:\s*none/.test(effectSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6e: For hover-triggered effects, the CSS SHALL include :hover pseudo-class
   */
  it('hover-triggered effects have :hover pseudo-class defined', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (effect.trigger !== 'hover') {
          return true; // Not a hover effect
        }

        // Check for :hover pseudo-class
        const hoverRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}:hover`,
          'g'
        );
        return hoverRegex.test(interactiveCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6f: For focus-triggered effects, the CSS SHALL include :focus or :focus-within
   */
  it('focus-triggered effects have :focus or :focus-within pseudo-class defined', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (effect.trigger !== 'focus') {
          return true; // Not a focus effect
        }

        // Check for :focus or :focus-within pseudo-class
        const focusRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}:focus(?:-within)?`,
          'g'
        );
        return focusRegex.test(interactiveCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6g: For active-triggered effects, the CSS SHALL include :active pseudo-class
   */
  it('active-triggered effects have :active pseudo-class defined', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (effect.trigger !== 'active') {
          return true; // Not an active effect
        }

        // Check for :active pseudo-class
        const activeRegex = new RegExp(
          `\\.halloween\\s+\\.${effect.cssClass}:active`,
          'g'
        );
        return activeRegex.test(interactiveCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6h: For any interactive effect, colors SHALL use the Halloween color palette
   * (270° hue for purple, 30° hue for orange/ember)
   */
  it('interactive effects use the correct Halloween color palette', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        const effectSection = extractEffectSection(interactiveCssContent, effect.cssClass);

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

          // Purple range: 255-295 (270 ± 25)
          const isPurple = hue >= 255 && hue <= 295;
          // Orange/ember range: 20-40 (30 ± 10)
          const isOrange = hue >= 20 && hue <= 40;

          return isPurple || isOrange;
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6i: For ember focus effect, the CSS SHALL include box-shadow property
   */
  it('ember focus effect has box-shadow defined', () => {
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (effect.id !== 'ember-focus') {
          return true; // Only test ember focus
        }

        const effectSection = extractEffectSection(interactiveCssContent, effect.cssClass);
        return /box-shadow\s*:/.test(effectSection);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Interactive Effect Reduced Motion Compliance', () => {
  /**
   * Property: Reduced motion fallback SHALL exist for animated effects
   */
  it('reduced motion fallback exists', () => {
    const hasReducedMotionQuery = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(interactiveCssContent);
    
    fc.assert(
      fc.property(fc.boolean(), () => {
        return hasReducedMotionQuery;
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Property: Reduced motion SHALL disable animations for animated effects
   */
  it('reduced motion disables animations for animated effects', () => {
    const reducedMotionMatch = interactiveCssContent.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\n\}/
    );
    
    fc.assert(
      fc.property(interactiveEffectArb, (effect: InteractiveEffect) => {
        if (!effect.expectedFeatures.includes('animation')) {
          return true; // No animation to disable
        }

        if (!reducedMotionMatch) {
          return false;
        }
        
        const reducedMotionSection = reducedMotionMatch[0];
        // Check that animation: none is set for this effect
        const hasAnimationNone = /animation\s*:\s*none/.test(reducedMotionSection);
        
        return hasAnimationNone;
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

  // Also find hover states
  const hoverRegex = new RegExp(
    `\\.halloween\\s+\\.${className}:hover[^{]*\\{[^}]*\\}`,
    'g'
  );
  const hoverMatches = css.match(hoverRegex) || [];

  // Also find focus states
  const focusRegex = new RegExp(
    `\\.halloween\\s+\\.${className}:focus[^{]*\\{[^}]*\\}`,
    'g'
  );
  const focusMatches = css.match(focusRegex) || [];

  // Also find focus-within states
  const focusWithinRegex = new RegExp(
    `\\.halloween\\s+\\.${className}:focus-within[^{]*\\{[^}]*\\}`,
    'g'
  );
  const focusWithinMatches = css.match(focusWithinRegex) || [];

  // Also find active states
  const activeRegex = new RegExp(
    `\\.halloween\\s+\\.${className}:active[^{]*\\{[^}]*\\}`,
    'g'
  );
  const activeMatches = css.match(activeRegex) || [];

  // Find related @keyframes by looking for animation names in the class
  const allMatches = [
    ...classMatches,
    ...pseudoMatches,
    ...hoverMatches,
    ...focusMatches,
    ...focusWithinMatches,
    ...activeMatches,
  ];
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
