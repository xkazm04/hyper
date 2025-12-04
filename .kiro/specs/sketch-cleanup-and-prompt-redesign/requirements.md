# Requirements: Sketch Cleanup and Character Prompt Redesign

## Overview
This feature addresses two main areas:
1. Automatic cleanup of generated sketches after final image generation or when starting over
2. Redesign of the character prompt building solution to incorporate story art style

## Background
- Sketches are generated in two places:
  - Character sketch: `src/app/features/editor/story/sub_Characters/components/ImageGeneratorSection.tsx`
  - Card sketch: `src/app/features/editor/story/sub_StoryCardEditor/components/ImageSection.tsx`
- Each sketched image has its own `imageId` and `generationId` from Leonardo API
- Character generation prompt currently does not incorporate the story art style prompt from stack configuration
- Story art style is managed via `src/app/api/stories/[id]/art-style/route.ts`

## Functional Requirements

### FR-1: Sketch Deletion API
Create a NextJS API endpoint connected to Leonardo API for deleting generations.

#### FR-1.1: Delete Generation Endpoint
- Create `DELETE /api/ai/generations/[generationId]` endpoint
- Connect to Leonardo API deletion endpoint: https://docs.leonardo.ai/reference/deletegenerationbyid
- Authenticate requests using existing auth patterns
- Return appropriate success/error responses

#### FR-1.2: Batch Delete Support
- Support deleting multiple generations in a single request
- Create `DELETE /api/ai/generations` endpoint accepting array of generationIds
- Handle partial failures gracefully

### FR-2: Automatic Sketch Cleanup

#### FR-2.1: Cleanup After Final Image Generation
- After generating and saving the final image, automatically delete all sketch generations
- Apply to both Character and Card image generation flows
- Track generationIds during sketch generation for later cleanup

#### FR-2.2: Cleanup on "Start Over"
- When user selects "Start over" option, delete existing sketches before generating new ones
- Clear local sketch state and trigger API deletion
- Handle cleanup failures gracefully (don't block user flow)

#### FR-2.3: Cleanup on Image Selection
- When user selects a sketch to use directly (without generating final), delete other unused sketches
- Keep only the selected sketch's generation

### FR-3: Character Prompt Redesign

#### FR-3.1: Prompt Composer Inputs
Redesign `src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer` to accept:
- Prompt sections from character prompt builder (archetype, pose, mood)
- Story art style prompt from stack configuration
- Character name and appearance

#### FR-3.2: AI-Powered Prompt Composition
- Use Groq client to intelligently compose the final prompt
- Combine character prompt sections with story art style
- Ensure output respects max character limit of 1600 characters
- Maintain coherent, well-structured prompt for image generation

#### FR-3.3: Integration with Sketch Generation
- Update sketch generation flow to use the new prompt composer
- Fetch story art style before generating sketches
- Pass composed prompt to image generation API

## Non-Functional Requirements

### NFR-1: Performance
- Sketch deletion should be non-blocking (fire-and-forget with error logging)
- Prompt composition via Groq should complete within 3 seconds

### NFR-2: Error Handling
- Deletion failures should not prevent user from continuing workflow
- Log deletion errors for monitoring
- Gracefully handle Groq API failures with fallback to simple concatenation

### NFR-3: Backwards Compatibility
- Existing prompt composition should continue to work
- Art style integration should be optional (works without story art style)

## Acceptance Criteria

### AC-1: Sketch Deletion
- [ ] API endpoint successfully deletes Leonardo generations by ID
- [ ] Sketches are automatically deleted after final image is saved
- [ ] Sketches are deleted when user clicks "Start over"
- [ ] Unused sketches are deleted when user selects one sketch directly

### AC-2: Character Prompt with Art Style
- [ ] Character prompt includes story art style when available
- [ ] Groq composes coherent prompt from multiple inputs
- [ ] Final prompt respects 1600 character limit
- [ ] Prompt composition works without story art style (fallback)

### AC-3: User Experience
- [ ] No visible delay from sketch cleanup operations
- [ ] Clear error messages if prompt composition fails
- [ ] Existing workflows continue to function

## References
- Leonardo Delete Generation API: https://docs.leonardo.ai/reference/deletegenerationbyid
- Current character prompt composer: `src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer/`
- Story art style API: `src/app/api/stories/[id]/art-style/route.ts`
- Image generation API: `src/app/api/ai/generate-images/route.ts`
