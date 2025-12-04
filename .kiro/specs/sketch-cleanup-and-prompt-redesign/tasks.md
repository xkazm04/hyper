# Implementation Plan: Sketch Cleanup and Character Prompt Redesign

## Overview
This plan bridges the gap between the current codebase and the design requirements for automatic sketch cleanup and AI-powered character prompt composition with story art style integration.

**Current State:**
- `generate-images` API already returns `generationId`
- Art style API exists at `/api/stories/[id]/art-style`
- PromptComposer already integrates story art style for card images
- Character prompt composer exists with basic functionality

---

- [x] 1. Create Leonardo Delete Generation API Endpoints






  - [x] 1.1 Create single delete endpoint at `src/app/api/ai/generations/[generationId]/route.ts`

    - Implement DELETE handler that calls Leonardo API
    - Add authentication check using existing patterns
    - Return appropriate success/error responses
    - _Requirements: FR-1.1_
  - [x] 1.2 Create batch delete endpoint at `src/app/api/ai/generations/route.ts`


    - Accept array of generationIds in request body
    - Call Leonardo API for each generation
    - Handle partial failures gracefully (return deleted/failed arrays)
    - _Requirements: FR-1.2_
-

- [x] 2. Create Sketch Cleanup Utility Service





  - [x] 2.1 Create `src/lib/services/sketchCleanup.ts`

    - Implement `deleteGenerations(ids: string[])` function
    - Make it non-blocking (fire-and-forget with error logging)
    - Handle empty array input gracefully
    - Support both single and batch deletion via the batch endpoint
    - _Requirements: FR-2.1, FR-2.2, FR-2.3, NFR-1_
- [x] 3. Update GeneratedImage Type to Include Generation Metadata




- [ ] 3. Update GeneratedImage Type to Include Generation Metadata

  - [x] 3.1 Update `src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/ImagePreviewGrid.tsx`


    - Add optional `generationId?: string` field to GeneratedImage interface
    - Add optional `imageId?: string` field to GeneratedImage interface
    - _Requirements: FR-2.1_
  - [x] 3.2 Update `useImageGenerator.ts` to capture generationId from API response


    - Extract generationId from generate-images response
    - Store it in the GeneratedImage objects
    - _Requirements: FR-2.1_

  - [x] 3.3 Update `usePromptPreview.ts` to capture generationId from API response

    - Extract generationId from generate-images response for card sketches
    - Store it in the GeneratedImage objects
    - _Requirements: FR-2.1_

- [x] 4. Update useImageGenerator Hook for Sketch Tracking and Cleanup





  - [x] 4.1 Add generationIds state tracking in `useImageGenerator.ts`


    - Add `const [generationIds, setGenerationIds] = useState<string[]>([])`
    - Update handleGenerateSketches to extract and store generationIds
    - _Requirements: FR-2.1_
  - [x] 4.2 Implement cleanup on handleClear ("Start over")

    - Call `deleteGenerations(generationIds)` before clearing state
    - Clear generationIds state after cleanup call
    - _Requirements: FR-2.2_
  - [x] 4.3 Implement cleanup on handleAddToCharacter (after final save)

    - Call `deleteGenerations(generationIds)` after successful save
    - Clear generationIds state
    - _Requirements: FR-2.1_

  - [x] 4.4 Implement cleanup on handleUseSketch (delete unused sketches)

    - Filter out the selected sketch's generationId
    - Call `deleteGenerations()` with remaining generationIds
    - _Requirements: FR-2.3_

- [x] 5. Update Card Image PromptComposer for Sketch Cleanup





  - [x] 5.1 Add generationIds state tracking in `usePromptPreview.ts`


    - Add generationIds state variable
    - Update handleGenerateSketches to extract and store generationIds
    - _Requirements: FR-2.1_
  - [x] 5.2 Implement cleanup on handleStartOver

    - Call `deleteGenerations(generationIds)` before clearing state
    - _Requirements: FR-2.2_

  - [x] 5.3 Implement cleanup on handleConfirmFinal and handleUseSketch

    - Call cleanup with appropriate generationIds
    - _Requirements: FR-2.1, FR-2.3_
-

- [x] 6. Checkpoint - Verify Sketch Cleanup Works




  - Ensure all tests pass, ask the user if questions arise.


- [x] 7. Create Groq Prompt Composition API Endpoint





  - [x] 7.1 Create `src/app/api/ai/compose-prompt/route.ts`

    - Accept character prompt sections (archetype, pose, mood) as input
    - Accept story art style prompt as input
    - Use Groq client to compose coherent prompt
    - Enforce 1600 character max limit
    - Return composed prompt
    - Handle Groq API errors gracefully
    - _Requirements: FR-3.1, FR-3.2_
-

- [x] 8. Create AI-Powered Prompt Composer Function




  - [x] 8.1 Create `src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer/aiPromptComposer.ts`


    - Implement `composeCharacterPromptWithAI()` function
    - Accept selections, art style, character info as inputs
    - Call `/api/ai/compose-prompt` endpoint
    - Fall back to simple composition on API failure
    - Return composed prompt string
    - _Requirements: FR-3.2, NFR-2_
  - [x] 8.2 Update `sub_characterPromptComposer/index.ts` to export new function


    - Add export for `composeCharacterPromptWithAI`
    - _Requirements: FR-3.2_
-

- [x] 9. Integrate Story Art Style into Character Image Generation




  - [x] 9.1 Update `useImageGenerator.ts` to fetch and use story art style


    - Import art style utilities from `sub_Story/lib/artStyleService`
    - Get story art style from EditorContext
    - Pass art style to AI prompt composer
    - _Requirements: FR-3.1, FR-3.3_

  - [x] 9.2 Update `ImageGeneratorSection.tsx` to pass story context

    - Ensure EditorContext is available
    - Pass storyStack to useImageGenerator if needed
    - _Requirements: FR-3.3_

  - [x] 9.3 Update handleGenerateSketches to use AI-composed prompt

    - Call `composeCharacterPromptWithAI()` instead of simple composition
    - Handle async composition
    - Fall back to current behavior if art style unavailable

    - _Requirements: FR-3.2, FR-3.3, NFR-3_

- [x] 10. Update Prompt Preview and Generation Flow





  - [x] 10.1 Update `ImagePromptInput.tsx` to show loading state during composition

    - Add loading indicator when AI is composing prompt
    - Display composed prompt in preview
    - _Requirements: FR-3.2_

  - [x] 10.2 Handle composition errors gracefully

    - Show user-friendly message if AI composition fails
    - Allow user to proceed with fallback prompt
    - _Requirements: NFR-2_
-

- [x] 11. Add Error Logging and Monitoring




  - [x] 11.1 Add logging to `sketchCleanup.ts`


    - Log deletion failures with generationIds
    - Include timestamps and error details
    - Don't expose sensitive data in logs
    - _Requirements: NFR-2_


  - [x] 11.2 Add logging to `compose-prompt/route.ts`
    - Log composition failures with input summary
    - Include timestamps and error details

    - _Requirements: NFR-2_
  - [x] 11.3 Add logging to `generations/route.ts`

    - Log deletion API errors
    - Include generationIds that failed
    - _Requirements: NFR-2_

- [x] 12. Final Checkpoint - End-to-End Validation





  - Ensure all tests pass, ask the user if questions arise.

---

## Dependencies

```
Task 1 → Task 2 → Tasks 4, 5
Task 3 → Tasks 4, 5
Task 7 → Task 8 → Task 9 → Task 10
Task 11 depends on Tasks 1, 2, 7
Task 12 depends on all other tasks
```

## File Changes Summary

### New Files
- `src/app/api/ai/generations/route.ts` - Batch delete endpoint
- `src/app/api/ai/generations/[generationId]/route.ts` - Single delete endpoint
- `src/app/api/ai/compose-prompt/route.ts` - Groq prompt composition
- `src/lib/services/sketchCleanup.ts` - Cleanup utility
- `src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer/aiPromptComposer.ts` - AI prompt composer

### Modified Files
- `src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/ImagePreviewGrid.tsx` - Add generationId to type
- `src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/useImageGenerator.ts` - Add tracking and cleanup
- `src/app/features/editor/story/sub_PromptComposer/components/sub_PromptPreview/usePromptPreview.ts` - Add tracking and cleanup
- `src/app/features/editor/story/sub_Characters/components/ImageGeneratorSection.tsx` - Pass story context
- `src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/ImagePromptInput.tsx` - Show AI composition state
- `src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer/index.ts` - Export new function

## Estimated Effort

| Task | Complexity | Estimate |
|------|------------|----------|
| 1    | Medium     | 2 hours  |
| 2    | Low        | 1 hour   |
| 3    | Low        | 1 hour   |
| 4    | Medium     | 2 hours  |
| 5    | Medium     | 2 hours  |
| 6    | -          | Checkpoint |
| 7    | Medium     | 2 hours  |
| 8    | Low        | 1 hour   |
| 9    | Medium     | 2 hours  |
| 10   | Low        | 1 hour   |
| 11   | Low        | 1 hour   |
| 12   | -          | Checkpoint |

**Total: ~15 hours**
