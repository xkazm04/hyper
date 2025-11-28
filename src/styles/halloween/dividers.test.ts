/**
 * Property-Based Tests for Halloween Divider Decorations
 * 
 * **Feature: halloween-theme-enrichment, Property 4: Divider Decoration**
 * **Validates: Requirements 4.1, 4.2**
 * 
 * Tests that for any horizontal or vertical divider element, when the Halloween
 * theme is active, the divider SHALL display the appropriate edge effect
 * (torn/jagged for horizontal, dripping for vertical) using clip-path or pseudo-elements.
 */

import { describe, it, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the dividers.css file content
let dividersCssContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'dividers.css');
  dividersCssContent = fs.readFileSync(cssPath, 'utf-8');
});

// Define the divider types from the design document
const DIVIDER_TYPES = [
  {
    id: 'torn-divider',
    cssClass: 'halloween-torn-divider',
    orientation: 'horizontal',
    expectedFeatures: ['clip-path', 'pseudo-element'],
  },
  {
    id: 'drip-divider',
    cssClass: 'halloween-drip-divider',
    orientation: 'vertical',
    expectedFeatures: ['clip-path', 'pseudo-element', 'animation'],
  },
] as const;

type DividerType = (typeof DIVIDER_TYPES)[number];

// Define header icon types
const HEADER_ICON_TYPES = [
  {
    id: 'header-icon-bat',
    cssClass: 'halloween-header-icon-bat',
    icon: '🦇',
  },
  {
    id: 'header-icon-spider',
    cssClass: 'halloween-header-icon-spider',
    icon: '🕷️',
  },
  {
    id: 'header-icon',
    cssClass: 'halloween-header-icon',
    icon: 'both',
  },
  {
    id: 'header-icon-skull',
    cssClass: 'halloween-header-icon-skull',
    icon: '💀',
  },
] as const;

type HeaderIconType = (typeof HEADER_ICON_TYPES)[number];

// Generator for divider types
const dividerTypeArb = fc.constantFrom(...DIVIDER_TYPES);

// Generator for header icon types
const headerIconTypeArb = fc.constantFrom(...HEADER_ICON_TYPES);

describe('Property 4: Divider Decoration', () => {
  /**
   * Property 4a: For any divider type, the CSS class SHALL exist in the stylesheet
   * scoped under .halloween
   */
  it('every divider type has a CSS class scoped under .halloween', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        // Check that the class exists and is scoped under .halloween
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${divider.cssClass}`,
          'g'
        );
        return scopedClassRegex.test(dividersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4b: For any divider type expecting pseudo-elements,
   * the CSS SHALL define ::before or ::after pseudo-elements
   */
  it('divider types with pseudo-element feature have ::before or ::after defined', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        if (!divider.expectedFeatures.includes('pseudo-element')) {
          return true; // No pseudo-element expected
        }

        // Check for pseudo-element definition
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${divider.cssClass}::(?:before|after)`,
          'g'
        );
        return pseudoRegex.test(dividersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4c: For any divider type expecting clip-path,
   * the CSS SHALL include clip-path property in pseudo-elements
   */
  it('divider types with clip-path feature have clip-path defined', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        if (!divider.expectedFeatures.includes('clip-path')) {
          return true; // No clip-path expected
        }

        const dividerSection = extractDividerSection(dividersCssContent, divider.cssClass);
        return /clip-path\s*:/.test(dividerSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4d: For horizontal dividers (torn-divider), the clip-path SHALL create
   * a jagged/torn edge pattern using polygon
   */
  it('horizontal dividers have jagged polygon clip-path', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        if (divider.orientation !== 'horizontal') {
          return true; // Only test horizontal dividers
        }

        const dividerSection = extractDividerSection(dividersCssContent, divider.cssClass);
        // Check for polygon clip-path with multiple points (jagged pattern)
        const hasPolygon = /clip-path\s*:\s*polygon\s*\(/.test(dividerSection);
        // Verify it has multiple percentage points indicating jagged edges
        const hasMultiplePoints = (dividerSection.match(/%/g) || []).length > 10;
        
        return hasPolygon && hasMultiplePoints;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4e: For vertical dividers (drip-divider), the CSS SHALL include
   * animation for the dripping effect
   */
  it('vertical dividers have animation for dripping effect', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        if (divider.orientation !== 'vertical') {
          return true; // Only test vertical dividers
        }

        if (!divider.expectedFeatures.includes('animation')) {
          return true; // No animation expected
        }

        const dividerSection = extractDividerSection(dividersCssContent, divider.cssClass);
        
        // Check for animation property
        const hasAnimation = /animation\s*:/.test(dividerSection);
        
        if (!hasAnimation) {
          return false;
        }

        // Extract animation name and verify @keyframes exists
        const animationMatch = dividerSection.match(/animation\s*:\s*([a-zA-Z]+)/);
        if (!animationMatch) {
          return false;
        }

        const animationName = animationMatch[1];
        const keyframesRegex = new RegExp(`@keyframes\\s+${animationName}`, 'i');
        return keyframesRegex.test(dividersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4f: For any divider type, colors SHALL use the 270° hue palette (purple)
   */
  it('divider effects use the correct Halloween color palette', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        const dividerSection = extractDividerSection(dividersCssContent, divider.cssClass);

        // Extract all hsl() color values
        const hslMatches = dividerSection.match(/hsl\s*\(\s*(\d+)/g) || [];

        if (hslMatches.length === 0) {
          return true; // No explicit hsl colors
        }

        // Check that all hue values are in the allowed range (purple: 270 ± 15)
        return hslMatches.every((match) => {
          const hueMatch = match.match(/hsl\s*\(\s*(\d+)/);
          if (!hueMatch) return true;

          const hue = parseInt(hueMatch[1], 10);
          const isPurple = hue >= 255 && hue <= 285;

          return isPurple;
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4g: Reduced motion fallback SHALL disable animations for vertical dividers
   */
  it('reduced motion fallback disables animations for vertical dividers', () => {
    // Check for prefers-reduced-motion media query
    const hasReducedMotionQuery = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(dividersCssContent);
    
    fc.assert(
      fc.property(fc.boolean(), () => {
        if (!hasReducedMotionQuery) {
          return false;
        }
        
        // Extract reduced motion section
        const reducedMotionMatch = dividersCssContent.match(
          /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\n\}/
        );
        
        if (!reducedMotionMatch) {
          return false;
        }
        
        const reducedMotionSection = reducedMotionMatch[0];
        // Check that animation: none is set for drip divider
        const hasAnimationNone = /animation\s*:\s*none/.test(reducedMotionSection);
        
        return hasAnimationNone;
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Property 4h: For any divider, pseudo-elements SHALL have pointer-events: none
   * to ensure they don't interfere with interactions
   */
  it('divider pseudo-elements have pointer-events: none', () => {
    fc.assert(
      fc.property(dividerTypeArb, (divider: DividerType) => {
        const dividerSection = extractDividerSection(dividersCssContent, divider.cssClass);
        
        // Check for pointer-events: none in pseudo-elements
        const hasPointerEventsNone = /pointer-events\s*:\s*none/.test(dividerSection);
        
        return hasPointerEventsNone;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Header Icon Decorations', () => {
  /**
   * Property: For any header icon type, the CSS class SHALL exist scoped under .halloween
   */
  it('every header icon type has a CSS class scoped under .halloween', () => {
    fc.assert(
      fc.property(headerIconTypeArb, (headerIcon: HeaderIconType) => {
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${headerIcon.cssClass}`,
          'g'
        );
        return scopedClassRegex.test(dividersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Header icons SHALL use pseudo-elements with content property
   */
  it('header icons use pseudo-elements with content property', () => {
    fc.assert(
      fc.property(headerIconTypeArb, (headerIcon: HeaderIconType) => {
        // Check for pseudo-element with content
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${headerIcon.cssClass}::(?:before|after)`,
          'g'
        );
        const hasPseudo = pseudoRegex.test(dividersCssContent);
        
        if (!hasPseudo) {
          return false;
        }
        
        // Check for content property in the section
        const iconSection = extractDividerSection(dividersCssContent, headerIcon.cssClass);
        const hasContent = /content\s*:\s*['"]/.test(iconSection);
        
        return hasContent;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Header icon pseudo-elements SHALL have pointer-events: none
   */
  it('header icon pseudo-elements have pointer-events: none', () => {
    fc.assert(
      fc.property(headerIconTypeArb, (headerIcon: HeaderIconType) => {
        const iconSection = extractDividerSection(dividersCssContent, headerIcon.cssClass);
        return /pointer-events\s*:\s*none/.test(iconSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Header icons SHALL have animation for floating effect
   */
  it('header icons have animation for floating effect', () => {
    fc.assert(
      fc.property(headerIconTypeArb, (headerIcon: HeaderIconType) => {
        const iconSection = extractDividerSection(dividersCssContent, headerIcon.cssClass);
        
        // Check for animation property
        const hasAnimation = /animation\s*:/.test(iconSection);
        
        if (!hasAnimation) {
          return false;
        }

        // Verify @keyframes exists for header icon animation
        return /@keyframes\s+headerIconFloat/.test(dividersCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Reduced motion SHALL disable header icon animations
   */
  it('reduced motion disables header icon animations', () => {
    const reducedMotionMatch = dividersCssContent.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\n\}/
    );
    
    fc.assert(
      fc.property(fc.boolean(), () => {
        if (!reducedMotionMatch) {
          return false;
        }
        
        const reducedMotionSection = reducedMotionMatch[0];
        // Check that header icon animations are disabled
        const hasHeaderIconDisabled = /halloween-header-icon/.test(reducedMotionSection) &&
                                      /animation\s*:\s*none/.test(reducedMotionSection);
        
        return hasHeaderIconDisabled;
      }),
      { numRuns: 1 }
    );
  });
});

/**
 * Helper function to extract the CSS section for a specific divider class
 */
function extractDividerSection(css: string, className: string): string {
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
