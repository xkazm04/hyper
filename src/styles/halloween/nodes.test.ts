/**
 * Property-Based Tests for Halloween Node and Card Edge Decorations
 * 
 * **Feature: halloween-theme-enrichment, Property 5: Node State Decorations**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * Tests that for any story node in any state (default, selected, hover, dead-end, start),
 * when the Halloween theme is active, the node SHALL display the appropriate decoration
 * including corner elements, outline styles, and state-specific border treatments.
 */

import { describe, it, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Read the nodes.css file content
let nodesCssContent: string;

beforeAll(() => {
  const cssPath = path.join(__dirname, 'nodes.css');
  nodesCssContent = fs.readFileSync(cssPath, 'utf-8');
});

// Define the node decoration types from the design document
const NODE_DECORATIONS = [
  {
    id: 'corner-decoration',
    cssClass: 'halloween-corner-decoration',
    state: 'default',
    expectedFeatures: ['pseudo-element', 'animation'],
    requirement: '5.1',
  },
  {
    id: 'node-selected',
    cssClass: 'halloween-node-selected',
    state: 'selected',
    expectedFeatures: ['outline', 'box-shadow', 'animation'],
    requirement: '5.2',
  },
  {
    id: 'crack-hover',
    cssClass: 'halloween-crack-hover',
    state: 'hover',
    expectedFeatures: ['pseudo-element', 'background'],
    requirement: '5.3',
  },
  {
    id: 'tombstone-border',
    cssClass: 'halloween-tombstone-border',
    state: 'dead-end',
    expectedFeatures: ['border-radius', 'border', 'box-shadow'],
    requirement: '5.4',
  },
  {
    id: 'portal-border',
    cssClass: 'halloween-portal-border',
    state: 'start',
    expectedFeatures: ['border', 'box-shadow', 'animation'],
    requirement: '5.5',
  },
] as const;

type NodeDecoration = (typeof NODE_DECORATIONS)[number];

// Generator for node decoration definitions
const nodeDecorationArb = fc.constantFrom(...NODE_DECORATIONS);

// Generator for node states
const nodeStateArb = fc.constantFrom('default', 'selected', 'hover', 'dead-end', 'start');

describe('Property 5: Node State Decorations', () => {
  /**
   * Property 5a: For any node decoration, the CSS class SHALL exist in the stylesheet
   * scoped under .halloween
   */
  it('every node decoration has a CSS class scoped under .halloween', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        // Check that the class exists and is scoped under .halloween
        const scopedClassRegex = new RegExp(
          `\\.halloween\\s+\\.${decoration.cssClass}`,
          'g'
        );
        return scopedClassRegex.test(nodesCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5b: For any node decoration with animation, the CSS SHALL define
   * the corresponding @keyframes
   */
  it('every animated node decoration has corresponding @keyframes defined', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('animation')) {
          return true; // No animation expected
        }

        // Extract the section for this decoration
        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);

        // Check for animation property
        const hasAnimation = /animation\s*:/.test(decorationSection);

        if (!hasAnimation) {
          return false;
        }

        // Extract animation name and verify @keyframes exists
        const animationMatch = decorationSection.match(/animation\s*:\s*([a-zA-Z]+)/);
        if (!animationMatch) {
          return false;
        }

        const animationName = animationMatch[1];
        const keyframesRegex = new RegExp(`@keyframes\\s+${animationName}`, 'i');
        return keyframesRegex.test(nodesCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5c: For any node decoration expecting pseudo-elements,
   * the CSS SHALL define ::before or ::after pseudo-elements
   */
  it('node decorations with pseudo-element feature have ::before or ::after defined', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('pseudo-element')) {
          return true; // No pseudo-element expected
        }

        // Check for pseudo-element definition
        const pseudoRegex = new RegExp(
          `\\.halloween\\s+\\.${decoration.cssClass}::(?:before|after)`,
          'g'
        );
        return pseudoRegex.test(nodesCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5d: For any node decoration expecting box-shadow,
   * the CSS SHALL include box-shadow property
   */
  it('node decorations with box-shadow feature have box-shadow defined', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('box-shadow')) {
          return true; // No box-shadow expected
        }

        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);
        return /box-shadow\s*:/.test(decorationSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5e: For any node decoration expecting outline,
   * the CSS SHALL include outline property
   */
  it('node decorations with outline feature have outline defined', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('outline')) {
          return true; // No outline expected
        }

        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);
        return /outline\s*:/.test(decorationSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5f: For any node decoration expecting border,
   * the CSS SHALL include border property
   */
  it('node decorations with border feature have border defined', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('border')) {
          return true; // No border expected
        }

        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);
        return /border\s*:/.test(decorationSection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5g: For tombstone border (dead-end nodes), the CSS SHALL include
   * tombstone-inspired border-radius (rounded top, flat bottom)
   */
  it('tombstone border has tombstone-inspired border-radius', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (decoration.id !== 'tombstone-border') {
          return true; // Only test tombstone border
        }

        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);
        // Check for border-radius with asymmetric values (rounded top)
        const hasBorderRadius = /border-radius\s*:/.test(decorationSection);
        // Tombstone should have larger top radius than bottom
        const hasAsymmetricRadius = /border-radius\s*:\s*\d+%\s+\d+%\s+\d+px\s+\d+px/.test(decorationSection);
        
        return hasBorderRadius && hasAsymmetricRadius;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5h: For portal border (start nodes), the CSS SHALL include
   * animated glow effect with multiple box-shadow layers
   */
  it('portal border has animated multi-layer glow effect', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (decoration.id !== 'portal-border') {
          return true; // Only test portal border
        }

        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);
        
        // Check for animation
        const hasAnimation = /animation\s*:/.test(decorationSection);
        
        // Check for multiple box-shadow layers (comma-separated)
        const boxShadowMatch = decorationSection.match(/box-shadow\s*:[^;]+/);
        if (!boxShadowMatch) {
          return false;
        }
        
        // Count shadow layers by counting commas + 1
        const shadowLayers = (boxShadowMatch[0].match(/,/g) || []).length + 1;
        
        return hasAnimation && shadowLayers >= 3;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5i: For crack hover effect, the CSS SHALL reveal pattern on :hover state
   */
  it('crack hover effect reveals pattern on hover', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (decoration.id !== 'crack-hover') {
          return true; // Only test crack hover
        }

        // Check for :hover pseudo-class
        const hoverRegex = new RegExp(
          `\\.halloween\\s+\\.${decoration.cssClass}:hover`,
          'g'
        );
        return hoverRegex.test(nodesCssContent);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5j: For any node decoration, colors SHALL use the 270° hue palette (purple)
   */
  it('node decorations use the correct Halloween color palette', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);

        // Extract all hsl() color values
        const hslMatches = decorationSection.match(/hsl\s*\(\s*(\d+)/g) || [];

        if (hslMatches.length === 0) {
          return true; // No explicit hsl colors
        }

        // Check that all hue values are in the allowed range
        return hslMatches.every((match) => {
          const hueMatch = match.match(/hsl\s*\(\s*(\d+)/);
          if (!hueMatch) return true;

          const hue = parseInt(hueMatch[1], 10);

          // Purple range: 255-295 (270 ± 25 for portal variations)
          const isPurple = hue >= 255 && hue <= 295;

          return isPurple;
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5k: For any node decoration with pseudo-elements,
   * pseudo-elements SHALL have pointer-events: none
   */
  it('node decoration pseudo-elements have pointer-events: none', () => {
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('pseudo-element')) {
          return true; // No pseudo-element expected
        }

        const decorationSection = extractDecorationSection(nodesCssContent, decoration.cssClass);
        return /pointer-events\s*:\s*none/.test(decorationSection);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Node Decoration Reduced Motion Compliance', () => {
  /**
   * Property: Reduced motion fallback SHALL exist for animated decorations
   */
  it('reduced motion fallback exists', () => {
    const hasReducedMotionQuery = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(nodesCssContent);
    
    fc.assert(
      fc.property(fc.boolean(), () => {
        return hasReducedMotionQuery;
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Property: Reduced motion SHALL disable animations for animated decorations
   */
  it('reduced motion disables animations for animated decorations', () => {
    const reducedMotionMatch = nodesCssContent.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\n\}/
    );
    
    fc.assert(
      fc.property(nodeDecorationArb, (decoration: NodeDecoration) => {
        if (!decoration.expectedFeatures.includes('animation')) {
          return true; // No animation to disable
        }

        if (!reducedMotionMatch) {
          return false;
        }
        
        const reducedMotionSection = reducedMotionMatch[0];
        // Check that animation: none is set for this decoration
        const hasAnimationNone = /animation\s*:\s*none/.test(reducedMotionSection);
        
        return hasAnimationNone;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to extract the CSS section for a specific decoration class
 */
function extractDecorationSection(css: string, className: string): string {
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

  // Find related @keyframes by looking for animation names in the class
  const allMatches = [...classMatches, ...pseudoMatches, ...hoverMatches];
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
