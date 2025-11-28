# Implementation Plan

- [x] 1. Set up CSS architecture and base infrastructure





  - [x] 1.1 Create halloween/borders.css with base border effect definitions


    - Create `src/styles/halloween/borders.css` with dripping-border, ethereal-glow, spectral-outline keyframes
    - Define CSS classes for each border effect type
    - Include prefers-reduced-motion fallbacks for all animated borders
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [x] 1.2 Write property test for border effects application


    - **Property 1: Border Effects Application**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [x] 1.3 Create halloween/backgrounds.css with background decoration definitions


    - Create `src/styles/halloween/backgrounds.css` with fog-layer, dust-particles, cobweb-pattern, vignette
    - Define layered pseudo-element structure with proper z-index
    - Ensure all overlays have pointer-events: none
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 1.4 Create halloween/lines.css with connection line styles


    - Create `src/styles/halloween/lines.css` with ghostly gradients for each choice type
    - Define hover glow intensification styles
    - Add particle flow animation keyframes
    - _Requirements: 2.1, 2.3, 2.4_
  - [x] 1.5 Write property test for reduced motion compliance


    - **Property 2: Reduced Motion Compliance**
    - **Validates: Requirements 1.5, 7.1**
  - [x] 1.6 Update globals.css to import new Halloween CSS modules


    - Add imports for borders.css, backgrounds.css, lines.css
    - Ensure proper cascade order
    - _Requirements: 1.4, 3.5_

- [x] 2. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 3. Implement border effects for cards and panels




  - [x] 3.1 Add dripping border effect to StoryNode component


    - Apply `halloween-drip-border` class to StoryNode container when Halloween theme active
    - Implement CSS pseudo-element with drip animation using clip-path
    - _Requirements: 1.1, 5.1_
  - [x] 3.2 Add ethereal glow to OutlineSidebar


    - Apply `halloween-ethereal-glow` class to sidebar container
    - Implement animated box-shadow with purple glow
    - _Requirements: 1.2_

  - [x] 3.3 Add candle-flicker glow to input fields on focus

    - Extend existing halloween-candle-flicker effect for input:focus states
    - Apply to ContentEditor, ChoiceEditor, and PromptComposer inputs
    - _Requirements: 1.3_
  - [x] 3.4 Write property test for connection line styling


    - **Property 3: Connection Line Styling**
    - **Validates: Requirements 2.1, 2.3, 2.4**


- [x] 4. Implement background decorations




  - [x] 4.1 Add fog layer to StoryGraph canvas


    - Apply `halloween-fog-layer` class to GraphCanvas component
    - Implement drifting fog using CSS gradient animation
    - _Requirements: 3.1_
  - [x] 4.2 Add floating dust particles to InfiniteCanvas


    - Apply `halloween-dust-particles` class to InfiniteCanvas container
    - Implement particle effect using radial-gradient background animation
    - _Requirements: 3.2_
  - [x] 4.3 Add cobweb pattern overlay to sidebars


    - Apply `halloween-cobweb` class to OutlineSidebar background
    - Implement cobweb pattern using linear-gradient with mask
    - _Requirements: 3.3_

  - [x] 4.4 Add vignette effect to main editor area

    - Apply `halloween-vignette` class to EditorLayout container
    - Implement radial-gradient vignette darkening edges
    - _Requirements: 3.4_
-

- [x] 5. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement decorative dividers and separators





  - [x] 6.1 Create torn-edge horizontal divider style


    - Create `halloween-torn-divider` class with clip-path jagged pattern
    - Apply to horizontal dividers in ChoicesSection and ContentSection
    - _Requirements: 4.1_
  - [x] 6.2 Write property test for divider decoration


    - **Property 4: Divider Decoration**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 6.3 Create dripping vertical divider style

    - Create `halloween-drip-divider` class with animated drip effect
    - Apply to vertical dividers in OutlineSidebar
    - _Requirements: 4.2_
  - [x] 6.4 Add decorative icons to section headers

    - Create `halloween-header-icon` class with bat/spider pseudo-element content
    - Apply to section headers in StoryCardEditor and PromptComposer
    - _Requirements: 4.3_


- [x] 7. Implement node and card edge decorations




  - [x] 7.1 Add corner decorations to story nodes


    - Create `halloween-corner-decoration` class with corner pseudo-elements
    - Apply to StoryNode component corners
    - _Requirements: 5.1_

  - [x] 7.2 Write property test for node state decorations

    - **Property 5: Node State Decorations**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - [x] 7.3 Add spectral outline to selected nodes


    - Create `halloween-node-selected` class with animated outline
    - Apply when node is in selected state
    - _Requirements: 5.2_

  - [x] 7.4 Add crack pattern to card hover states

    - Create `halloween-crack-hover` class with crack pattern background on hover
    - Apply to StoryNode and card components
    - _Requirements: 5.3_

  - [x] 7.5 Add tombstone border to dead-end nodes

    - Create `halloween-tombstone-border` class with tombstone-inspired border-radius and styling
    - Apply to nodes with isDeadEnd flag
    - _Requirements: 5.4_

  - [x] 7.6 Add portal glow border to start nodes

    - Create `halloween-portal-border` class with animated portal glow effect
    - Apply to nodes with isFirst flag
    - _Requirements: 5.5_

- [x] 8. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 9. Implement interactive state enhancements

  - [x] 9.1 Add smoke wisp effect to button hover


    - Create `halloween-smoke-wisp` class with smoke pseudo-element animation
    - Apply to primary buttons in Halloween theme
    - _Requirements: 6.1_
  - [x] 9.2 Write property test for interactive effect feedback



    - **Property 6: Interactive Effect Feedback**
    - **Validates: Requirements 6.1, 6.3, 6.5**

  - [x] 9.3 Add spectral ripple to button click
    - Create `halloween-spectral-ripple` class with ripple animation on :active
    - Apply to clickable elements
    - _Requirements: 6.2_

  - [x] 9.4 Add ember particles to input focus
    - Create `halloween-ember-focus` class with ember particle animation
    - Apply to input fields on focus state
    - _Requirements: 6.3_
  - [x] 9.5 Add ghost trail to dragged nodes

    - Create `halloween-ghost-trail` class for drag state
    - Apply to draggable nodes in StoryGraph
    - _Requirements: 6.4_
  - [x] 9.6 Ensure pointer-events preserved on interactive elements

    - Verify all decorative pseudo-elements have pointer-events: none
    - Test click targets are not blocked by decorations
    - _Requirements: 6.5_
-

- [x] 10. Implement component-specific theming




  - [x] 10.1 Add haunted tree aesthetic to OutlineSidebar


    - Create `halloween-tree-sidebar` class with branch-like divider styling
    - Apply twisted branch pattern to tree structure
    - _Requirements: 8.1_

  - [x] 10.2 Add cauldron container to PromptComposer

    - Create `halloween-cauldron-container` class with bubbling border effect
    - Apply cauldron-inspired rounded bottom styling
    - _Requirements: 8.2_
  - [x] 10.3 Add spell-book aesthetic to StoryCardEditor


    - Create `halloween-spellbook-page` class with aged edge effect
    - Apply parchment-like background texture
    - _Requirements: 8.3_
  - [x] 10.4 Add crystal ball glow to CommandPalette


    - Create `halloween-crystal-glow` class with orb-like glow effect
    - Apply to CommandPalette backdrop and container
    - _Requirements: 8.4_
  - [x] 10.5 Add potion-bottle aesthetic to ScriptQualityAssistant


    - Create `halloween-potion-metrics` class with bottle-shaped containers
    - Apply bubbling liquid effect to score indicators
    - _Requirements: 8.5_

- [x] 11. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement accessibility and performance optimizations





  - [x] 12.1 Add decoration toggle configuration


    - Create CSS custom property `--halloween-decorations-enabled` for toggling
    - Implement decoration disable class `halloween-no-decorations`
    - _Requirements: 7.5_
  - [x] 12.2 Write property test for CSS performance compliance


    - **Property 7: CSS Performance Compliance**
    - **Validates: Requirements 7.3, 7.4**
  - [x] 12.3 Verify GPU-accelerated properties usage


    - Audit all animations to use transform and opacity only
    - Replace any width/height/margin animations with transform equivalents
    - _Requirements: 7.3_
  - [x] 12.4 Verify overlay positioning


    - Ensure all decorative overlays use fixed or absolute positioning
    - Verify no layout thrashing from decoration updates
    - _Requirements: 7.4_

  - [x] 12.5 Write property test for text contrast compliance

    - **Property 8: Text Contrast Compliance**
    - **Validates: Requirements 7.2**
  - [x] 12.6 Verify WCAG AA contrast ratios


    - Test all text over decorative backgrounds meets 4.5:1 ratio
    - Adjust decoration opacity if needed to maintain contrast
    - _Requirements: 7.2_

- [x] 13. Final integration and documentation




  - [x] 13.1 Update EFFECTS.md documentation


    - Add documentation for all new border, background, line, and interactive effects
    - Include usage examples and applicable components
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 13.2 Create halloween/decorations.css index file


    - Create barrel file importing all Halloween decoration CSS modules
    - Ensure proper import order for cascade
    - _Requirements: 1.4_

- [x] 14. Final Checkpoint - Ensure all tests pass








  - Ensure all tests pass, ask the user if questions arise.

