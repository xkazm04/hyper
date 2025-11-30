# Design: Sketch Cleanup and Character Prompt Redesign

## 1. Overview

This design document outlines the technical approach for implementing automatic sketch cleanup and redesigning the character prompt composition system to incorporate story art styles.

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Components                       │
├─────────────────────────────────────────────────────────────────┤
│  ImageGeneratorSection.tsx    │    ImageSection.tsx             │
│  (Character Sketches)         │    (Card Sketches)              │
│           │                   │           │                      │
│           ▼                   │           ▼                      │
│  useImageGenerator.ts         │    PromptComposer.tsx           │
│  (tracks generationIds)       │    (tracks generationIds)       │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  /api/ai/generations/[generationId]  │  /api/ai/compose-prompt  │
│  (DELETE - single)                   │  (POST - Groq compose)   │
│                                      │                          │
│  /api/ai/generations                 │                          │
│  (DELETE - batch)                    │                          │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
├─────────────────────────────────────────────────────────────────┤
│  Leonardo API                        │  Groq API                │
│  DELETE /generations/{id}            │  Chat Completions        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### Sketch Cleanup Flow
```
1. User generates sketches → Store generationIds in state
2. User action (final image/start over/select sketch)
3. Trigger cleanup → Call DELETE API (non-blocking)
4. API calls Leonardo → Delete generations
5. Clear local state
```

#### Prompt Composition Flow
```
1. User selects prompt options (archetype, pose, mood)
2. Fetch story art style from context
3. Call /api/ai/compose-prompt with all inputs
4. Groq composes optimized prompt (≤1600 chars)
5. Return composed prompt for image generation
```

## 3. API Design

### 3.1 Delete Generation Endpoint

#### Single Delete
```typescript
// DELETE /api/ai/generations/[generationId]
// Request: None (generationId in URL)
// Response:
{
  success: boolean;
  message?: string;
  error?: string;
}
```

#### Batch Delete
```typescript
// DELETE /api/ai/generations
// Request:
{
  generationIds: string[];
}
// Response:
{
  success: boolean;
  deleted: string[];
  failed: { id: string; error: string }[];
}
```

### 3.2 Compose Prompt Endpoint

```typescript
// POST /api/ai/compose-prompt
// Request:
{
  characterName?: string;
  characterAppearance?: string;
  archetype?: {
    label: string;
    prompt: string;
  };
  pose?: {
    label: string;
    prompt: string;
  };
  mood?: {
    label: string;
    prompt: string;
  };
  storyArtStyle?: string;
  maxLength?: number; // default: 1600
}
// Response:
{
  success: boolean;
  prompt: string;
  truncated: boolean;
  originalLength?: number;
}
```

## 4. Implementation Details

### 4.1 Generation Tracking

Update `GeneratedImage` interface to include generationId:

```typescript
// src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/types.ts
export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  prompt?: string;
  generationId?: string;  // Add this field
  imageId?: string;       // Add this field
}
```

### 4.2 Cleanup Service

Create a cleanup utility:

```typescript
// src/lib/services/sketchCleanup.ts
export async function deleteGenerations(generationIds: string[]): Promise<void> {
  if (generationIds.length === 0) return;
  
  // Fire-and-forget with error logging
  fetch('/api/ai/generations', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ generationIds }),
  }).catch(err => console.error('Sketch cleanup failed:', err));
}
```

### 4.3 Prompt Composer Redesign

```typescript
// src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer/aiPromptComposer.ts

interface PromptComposerInput {
  characterName?: string;
  characterAppearance?: string;
  selections: {
    archetype?: CharacterPromptOption;
    pose?: CharacterPromptOption;
    mood?: CharacterPromptOption;
  };
  storyArtStyle?: string;
}

export async function composeCharacterPromptWithAI(
  input: PromptComposerInput
): Promise<string> {
  const response = await fetch('/api/ai/compose-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      characterName: input.characterName,
      characterAppearance: input.characterAppearance,
      archetype: input.selections.archetype,
      pose: input.selections.pose,
      mood: input.selections.mood,
      storyArtStyle: input.storyArtStyle,
      maxLength: 1600,
    }),
  });
  
  if (!response.ok) {
    // Fallback to simple composition
    return composeCharacterPrompt(
      input.selections,
      input.characterName,
      input.characterAppearance
    );
  }
  
  const data = await response.json();
  return data.prompt;
}
```

### 4.4 Groq Prompt Template

```typescript
const COMPOSE_SYSTEM_PROMPT = `You are an expert at composing image generation prompts.
Your task is to combine multiple prompt elements into a single, coherent prompt.

Rules:
1. Output MUST be under {maxLength} characters
2. Prioritize visual details over abstract concepts
3. Maintain the art style throughout
4. Be specific and descriptive
5. Output ONLY the prompt text, no explanations

Input elements:
- Art Style: The visual style to apply
- Character: Name and appearance details
- Archetype: Character class/role description
- Pose: Body position and stance
- Expression: Facial expression and mood`;
```

## 5. State Management Updates

### 5.1 useImageGenerator Hook Updates

```typescript
// Track generationIds for cleanup
const [generationIds, setGenerationIds] = useState<string[]>([]);

// Update handleGenerateSketches to store generationIds
const handleGenerateSketches = useCallback(async () => {
  // ... existing code ...
  
  // After generating sketches, extract and store generationIds
  const ids = validSketches
    .map(s => s.generationId)
    .filter((id): id is string => !!id);
  setGenerationIds(ids);
}, [/* deps */]);

// Update handleClear to trigger cleanup
const handleClear = useCallback(() => {
  // Cleanup existing sketches
  if (generationIds.length > 0) {
    deleteGenerations(generationIds);
  }
  
  setSelections({});
  setSketches([]);
  setGenerationIds([]);
  // ... rest of cleanup
}, [generationIds]);

// Update handleAddToCharacter to cleanup after save
const handleAddToCharacter = useCallback(async () => {
  // ... save image ...
  
  // Cleanup all sketches after successful save
  if (generationIds.length > 0) {
    deleteGenerations(generationIds);
  }
  
  // ... reset state ...
}, [generationIds, /* other deps */]);
```

## 6. Error Handling

### 6.1 Deletion Errors
- Log errors but don't block user flow
- Implement retry logic for transient failures
- Track failed deletions for potential manual cleanup

### 6.2 Prompt Composition Errors
- Fallback to simple concatenation if Groq fails
- Log errors for monitoring
- Show user-friendly message if fallback is used

## 7. Testing Strategy

### 7.1 Unit Tests
- Test deletion API with mocked Leonardo responses
- Test prompt composition with various input combinations
- Test fallback behavior when services fail

### 7.2 Integration Tests
- Test full sketch generation → cleanup flow
- Test prompt composition with real Groq API
- Test error scenarios and recovery

## 8. Correctness Properties

### CP-1: Sketch Cleanup Completeness
All generated sketches must be tracked and deleted when:
- Final image is saved
- User clicks "Start over"
- User selects a sketch directly

### CP-2: Prompt Length Constraint
Composed prompts must never exceed 1600 characters.

### CP-3: Art Style Integration
When story art style is available, it must be incorporated into the character prompt.

### CP-4: Graceful Degradation
System must continue to function when:
- Leonardo deletion API fails
- Groq API fails
- Story art style is not configured

## 9. File Changes Summary

### New Files
- `src/app/api/ai/generations/route.ts` - Batch delete endpoint
- `src/app/api/ai/generations/[generationId]/route.ts` - Single delete endpoint
- `src/app/api/ai/compose-prompt/route.ts` - Groq prompt composition
- `src/lib/services/sketchCleanup.ts` - Cleanup utility

### Modified Files
- `src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/useImageGenerator.ts`
- `src/app/features/editor/story/sub_Characters/components/sub_ImageGenerator/types.ts`
- `src/app/features/editor/story/sub_PromptComposer/PromptComposer.tsx`
- `src/app/features/editor/story/sub_Characters/lib/sub_characterPromptComposer/promptBuilder.ts`
