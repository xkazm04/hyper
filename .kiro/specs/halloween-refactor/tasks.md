# Implementation Plan

- [x] 1. Set up refactoring infrastructure





  - [x] 1.1 Create file scanner utility


    - Create `src/lib/refactor/scanner.ts` with functions to scan directories and count lines
    - Implement file categorization logic based on path patterns
    - Implement priority sorting by line count
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Write property tests for scanner


    - **Property 1: File Scanner Completeness**
    - **Property 2: File Categorization Consistency**
    - **Property 3: Priority Sorting Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [x] 1.3 Create barrel file generator utility


    - Create `src/lib/refactor/barrel.ts` to generate index.ts exports
    - Support named exports and default exports
    - _Requirements: 2.5_
  - [x] 1.4 Write property test for barrel generator


    - **Property 5: Barrel Export Completeness**
    - **Validates: Requirements 2.5**

- [x] 2. Refactor globals.css and create Halloween effect system





  - [x] 2.1 Extract theme variables to dedicated file


    - Create `src/styles/theme-variables.css` with :root and .halloween variables
    - Keep only essential base styles in globals.css
    - _Requirements: 5.1, 5.2_

  - [x] 2.2 Create Halloween effects catalog

    - Create `src/styles/halloween/effects.css` with all 8 effect definitions
    - Implement ghost-float, spider-web-corner, candle-flicker, bat-silhouette effects
    - Implement cauldron-bubble, pumpkin-glow, skeleton-rattle, fog-overlay effects
    - Include prefers-reduced-motion fallbacks for all animations
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 8.1_
  - [x] 2.3 Write property tests for CSS Halloween compliance


    - **Property 7: CSS Halloween Compliance**
    - **Validates: Requirements 4.2, 4.3, 4.5**
  - [x] 2.4 Create effect catalog documentation


    - Create `src/styles/halloween/EFFECTS.md` documenting each effect
    - Include effect name, CSS class, applicable components, usage examples
    - _Requirements: 8.1, 8.2_
  - [x] 2.5 Write property test for effect catalog completeness


    - **Property 12: Effect Catalog Field Completeness**
    - **Property 13: Utility Class Availability**
    - **Validates: Requirements 8.2, 8.3**


- [x] 3. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 4. Refactor large service files




  - [x] 4.1 Refactor marketplace.ts (907 lines)


    - Split into: `marketplace/api.ts`, `marketplace/assets.ts`, `marketplace/collections.ts`, `marketplace/reviews.ts`
    - Create `marketplace/index.ts` barrel file preserving all exports
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.2 Refactor story.ts (799 lines)


    - Split into: `story/crud.ts`, `story/cards.ts`, `story/characters.ts`, `story/publishing.ts`
    - Create `story/index.ts` barrel file preserving all exports
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.3 Refactor sync.ts (377 lines)


    - Split into: `sync/queue.ts`, `sync/operations.ts`, `sync/conflict.ts`
    - Create `sync/index.ts` barrel file preserving all exports
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.4 Write property test for export preservation


    - **Property 6: Export Preservation**
    - **Validates: Requirements 3.3, 6.3**
- [x] 5. Refactor type definition files




- [ ] 5. Refactor type definition files

  - [x] 5.1 Refactor types/index.ts (650 lines)


    - Split into: `types/story.ts`, `types/card.ts`, `types/character.ts`, `types/common.ts`
    - Re-export all types from index.ts for backward compatibility
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 5.2 Refactor types/nodes.ts (412 lines)


    - Split into: `types/nodes/base.ts`, `types/nodes/story.ts`, `types/nodes/graph.ts`
    - Create barrel file preserving exports
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 5.3 Refactor templates/stackTemplates.ts (716 lines)


    - Split into: `templates/basic.ts`, `templates/advanced.ts`, `templates/presets.ts`
    - Create barrel file preserving exports
    - _Requirements: 6.1, 6.2_
-

- [x] 6. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Refactor large component files - StoryGraph module






  - [x] 7.1 Refactor StoryGraph.tsx (537 lines)

    - Extract: `sub_StoryGraph/components/GraphCanvas.tsx`, `GraphControls.tsx`, `GraphLegend.tsx`
    - Keep main StoryGraph.tsx as composition of sub-components
    - Apply halloween-cauldron-bubble effect to graph canvas
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [x] 7.2 Refactor StoryNode.tsx (532 lines)

    - Extract: `NodeContent.tsx`, `NodeConnectors.tsx`, `NodeActions.tsx`
    - Apply halloween-ghost-float effect to nodes
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [x] 7.3 Refactor useStoryGraphData.tsx (366 lines)

    - Extract: `useGraphLayout.ts`, `useGraphSelection.ts`, `useGraphOperations.ts`
    - Compose in main hook
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 7.4 Refactor useKeyboardNavigation.ts (273 lines)


    - Extract: `useArrowNavigation.ts`, `useShortcuts.ts`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.5 Write property tests for hook composition

    - **Property 10: Hook Composition Integrity**
    - **Property 11: Sub-hook Directory Structure**
    - **Validates: Requirements 7.2, 7.3**

- [x] 8. Refactor large component files - PromptComposer module






  - [x] 8.1 Refactor PromptPreview.tsx (554 lines)

    - Extract: `PreviewHeader.tsx`, `PreviewContent.tsx`, `PreviewActions.tsx`, `PreviewVariables.tsx`
    - Apply halloween-fog-overlay effect to preview area
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 8.2 Refactor OptionSelector.tsx (364 lines)


    - Extract: `OptionList.tsx`, `OptionItem.tsx`, `OptionSearch.tsx`
    - Apply halloween-candle-flicker effect to selected options
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

- [x] 9. Refactor large component files - InfiniteCanvas module



  - [x] 9.1 Refactor InfiniteCanvas.tsx (472 lines)


    - Extract: `CanvasViewport.tsx`, `CanvasGrid.tsx`, `CanvasControls.tsx`
    - Apply halloween-fog-overlay effect to canvas background
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 9.2 Refactor SuggestedCardNode.tsx (238 lines)


    - Extract: `SuggestionContent.tsx`, `SuggestionActions.tsx`
    - Apply halloween-ghost-float effect
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 9.3 Refactor useAISuggestions.ts (299 lines)


    - Extract: `useSuggestionGeneration.ts`, `useSuggestionState.ts`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 11. Refactor large component files - Characters module




  - [x] 11.1 Refactor ImageGeneratorSection.tsx (472 lines)


    - Extract: `ImagePromptInput.tsx`, `ImagePreviewGrid.tsx`, `ImageGenerationControls.tsx`
    - Apply halloween-pumpkin-glow effect to generated images
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 11.2 Refactor AvatarGeneratorSection.tsx (371 lines)


    - Extract: `AvatarPromptBuilder.tsx`, `AvatarPreview.tsx`, `AvatarStyleSelector.tsx`
    - Apply halloween-bat-silhouette decoration
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 11.3 Refactor CharacterEditor.tsx (263 lines)


    - Extract: `CharacterForm.tsx`, `CharacterPreview.tsx`
    - Apply halloween-spider-web-corner decoration
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 11.4 Refactor characterPromptComposer.ts (331 lines)


    - Split into: `promptTemplates.ts`, `promptBuilder.ts`, `promptVariables.ts`
    - _Requirements: 3.1, 3.2_


- [x] 12. Refactor large component files - StoryCardEditor module




  - [x] 12.1 Refactor ChoicesSection.tsx (454 lines)


    - Extract: `ChoiceList.tsx`, `ChoiceItem.tsx`, `ChoiceEditor.tsx`, `ChoicePreview.tsx`
    - Apply halloween-skeleton-rattle effect on hover
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [x] 12.2 Refactor ContentSection.tsx (278 lines)

    - Extract: `ContentEditor.tsx`, `ContentPreview.tsx`, `ContentToolbar.tsx`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 12.3 Refactor PublishDialog.tsx (248 lines)

    - Extract: `PublishForm.tsx`, `PublishPreview.tsx`, `PublishStatus.tsx`
    - Apply halloween-candle-flicker effect to publish button
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

- [x] 13. Refactor remaining large components




  - [x] 13.1 Refactor ChoiceEditor.tsx (326 lines)
    - Extract: `ChoiceForm.tsx`, `ChoiceConditions.tsx`, `ChoiceTargets.tsx`
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 13.2 Refactor CommandPalette.tsx (301 lines)


    - Extract: `CommandList.tsx`, `CommandItem.tsx`, `CommandSearch.tsx`
    - Apply halloween-fog-overlay effect to backdrop
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 13.3 Refactor OutlineSidebar.tsx (286 lines)


    - Extract: `OutlineTree.tsx`, `OutlineItem.tsx`, `OutlineActions.tsx`
    - Apply halloween-spider-web-corner decoration
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 13.4 Refactor ScriptQualityAssistant.tsx (416 lines)



    - Extract: `QualityMetrics.tsx`, `QualitySuggestions.tsx`, `QualityScore.tsx`
    - _Requirements: 2.1, 2.2, 2.3_


- [x] 14. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Refactor marketplace components





  - [x] 15.1 Refactor CreateAssetForm.tsx (417 lines)

    - Extract: `AssetMetadataForm.tsx`, `AssetFileUpload.tsx`, `AssetPreview.tsx`, `AssetPricing.tsx`
    - Apply halloween-pumpkin-glow effect to submit button
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 15.2 Refactor ApprovalQueue.tsx (285 lines)


    - Extract: `QueueList.tsx`, `QueueItem.tsx`, `ApprovalActions.tsx`
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 15.3 Refactor AssetDetailModal.tsx (260 lines)


    - Extract: `AssetInfo.tsx`, `AssetReviews.tsx`, `AssetActions.tsx`
    - Apply halloween-ghost-float effect to modal
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 15.4 Refactor ApiKeyManager.tsx (256 lines)


    - Extract: `KeyList.tsx`, `KeyForm.tsx`, `KeyUsage.tsx`
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 15.5 Refactor SearchFilters.tsx (245 lines)


    - Extract: `FilterGroup.tsx`, `FilterOption.tsx`, `ActiveFilters.tsx`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 15.6 Refactor useMarketplace.ts (336 lines)

    - Extract: `useAssets.ts`, `useCollections.ts`, `useSearch.ts`
    - _Requirements: 7.1, 7.2, 7.3_


- [x] 16. Refactor large hooks





  - [x] 16.1 Refactor useOfflineStory.ts (526 lines)

    - Extract: `useOfflineSync.ts`, `useOfflineStorage.ts`, `useOfflineQueue.ts`, `useOfflineConflict.ts`
    - Compose in main hook
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 16.2 Refactor useSupabaseTable.ts (269 lines)

    - Extract: `useTableQuery.ts`, `useTableMutation.ts`, `useTableSubscription.ts`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 17. Refactor remaining large files






  - [x] 17.1 Refactor StoryPlayer.tsx (397 lines)

    - Extract: `PlayerControls.tsx`, `PlayerContent.tsx`, `PlayerProgress.tsx`
    - Apply halloween-fog-overlay effect to player background
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [x] 17.2 Refactor accessible-modal.tsx (357 lines)

    - Extract: `ModalHeader.tsx`, `ModalContent.tsx`, `ModalFooter.tsx`, `ModalOverlay.tsx`
    - Apply halloween-ghost-float effect
    - _Requirements: 2.1, 2.2, 2.3, 4.1_
  - [x] 17.3 Refactor CardContrastPreview.tsx (335 lines)


    - Extract: `ContrastMetrics.tsx`, `ContrastPreview.tsx`, `ContrastControls.tsx`
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 17.4 Refactor high-contrast-palette.ts (491 lines)


    - Split into: `palette/colors.ts`, `palette/contrast.ts`, `palette/accessibility.ts`
    - _Requirements: 3.1, 3.2_
-

- [x] 18. Refactor utility and lib files



  - [x] 18.1 Refactor indexeddb.ts (327 lines)


    - Split into: `indexeddb/connection.ts`, `indexeddb/operations.ts`, `indexeddb/migrations.ts`
    - _Requirements: 3.1, 3.2_
  - [x] 18.2 Refactor compiler.ts (269 lines)


    - Split into: `compiler/parser.ts`, `compiler/transformer.ts`, `compiler/generator.ts`
    - _Requirements: 3.1, 3.2_

  - [x] 18.3 Refactor groq-client.ts (262 lines)

    - Split into: `groq/client.ts`, `groq/streaming.ts`, `groq/types.ts`
    - _Requirements: 3.1, 3.2_
  - [x] 18.4 Refactor mood.ts (354 lines)


    - Split into: `mood/analyzer.ts`, `mood/themes.ts`, `mood/transitions.ts`
    - _Requirements: 3.1, 3.2_

  - [x] 18.5 Refactor ai-prediction.ts (279 lines)

    - Split into: `prediction/engine.ts`, `prediction/models.ts`, `prediction/cache.ts`
    - _Requirements: 3.1, 3.2_

  - [x] 18.6 Refactor image.ts (273 lines)

    - Split into: `image/upload.ts`, `image/processing.ts`, `image/storage.ts`
    - _Requirements: 3.1, 3.2_

- [x] 19. Verify output file size constraints





  - [x] 19.1 Write property test for file size constraint


    - **Property 4: Output File Size Constraint**
    - **Validates: Requirements 2.3**
  - [x] 19.2 Write property test for CSS module co-location


    - **Property 8: Globals CSS Minimization**
    - **Property 9: CSS Module Co-location**
    - **Validates: Requirements 5.2, 5.3**

- [x] 20. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
