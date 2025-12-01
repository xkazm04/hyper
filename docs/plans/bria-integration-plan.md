# Bria API Integration Plan

## Overview

Replace the current Gemini-based character insertion mechanism with Bria AI's Tailored Generation API. This enables:
1. **Character Model Training**: Train custom AI models from character images
2. **Scene Composition**: Insert trained characters into scenes while preserving scene structure

## Current State Analysis

### Existing Components
- **Character type** (`src/lib/types/character.ts`): Supports `imageUrls[]` (max 4), `imagePrompts[]`, `avatarUrl`
- **CharacterEditor** (`sub_Characters/CharacterEditor.tsx`): Manages character images with add/remove handlers
- **ImageGeneratorSection**: Generates character images via Leonardo API
- **ImageInsertPanel**: Current Gemini-based character insertion (to be replaced)
- **Database**: `characters` table with `image_urls[]` constraint max 4 images

### What Needs to Change
1. Extend character image capacity from 4 to 10
2. Add Bria training state tracking per character
3. Replace Gemini insertion with Bria reimagine API
4. Add training workflow UI and status indicators

---

## Phase 1: Database Schema Extension

### New Migration: `00017_bria_training.sql`

```sql
-- Extend character image capacity from 4 to 10
ALTER TABLE characters
DROP CONSTRAINT IF EXISTS check_max_images;

ALTER TABLE characters
ADD CONSTRAINT check_max_images CHECK (
  array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 10
);

-- Update prompts constraint to match
ALTER TABLE characters
DROP CONSTRAINT IF EXISTS check_prompts_match_images;

ALTER TABLE characters
ADD CONSTRAINT check_prompts_match_images CHECK (
  (array_length(image_urls, 1) IS NULL AND array_length(image_prompts, 1) IS NULL)
  OR array_length(image_urls, 1) = array_length(image_prompts, 1)
);

-- Add Bria training fields to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS bria_project_id TEXT,
ADD COLUMN IF NOT EXISTS bria_dataset_id TEXT,
ADD COLUMN IF NOT EXISTS bria_model_id TEXT,
ADD COLUMN IF NOT EXISTS bria_model_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS bria_caption_prefix TEXT,
ADD COLUMN IF NOT EXISTS bria_training_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bria_training_completed_at TIMESTAMPTZ;

-- Add index for characters with trained models
CREATE INDEX IF NOT EXISTS idx_characters_bria_model
ON characters (bria_model_id)
WHERE bria_model_id IS NOT NULL;

-- Add check constraint for valid Bria statuses
ALTER TABLE characters
ADD CONSTRAINT check_bria_status CHECK (
  bria_model_status IN ('none', 'pending', 'training', 'completed', 'failed')
);

COMMENT ON COLUMN characters.bria_project_id IS 'Bria Tailored Gen project ID';
COMMENT ON COLUMN characters.bria_dataset_id IS 'Bria Tailored Gen dataset ID';
COMMENT ON COLUMN characters.bria_model_id IS 'Bria Tailored Gen trained model ID';
COMMENT ON COLUMN characters.bria_model_status IS 'Training status: none, pending, training, completed, failed';
COMMENT ON COLUMN characters.bria_caption_prefix IS 'Auto-generated caption prefix for the character';
```

### Updated Character Type

```typescript
// src/lib/types/character.ts - additions
export interface Character {
  // ... existing fields ...
  imageUrls: string[]  // Now up to 10 images

  // Bria training fields
  briaProjectId: string | null
  briaDatasetId: string | null
  briaModelId: string | null
  briaModelStatus: BriaModelStatus
  briaCaptionPrefix: string | null
  briaTrainingStartedAt: string | null
  briaTrainingCompletedAt: string | null
}

export type BriaModelStatus = 'none' | 'pending' | 'training' | 'completed' | 'failed'
```

---

## Phase 2: Bria Service Layer

### New File: `src/lib/services/bria.ts`

```typescript
/**
 * Bria AI Tailored Generation Service
 *
 * Handles:
 * - Project/Dataset/Model lifecycle management
 * - Character model training pipeline
 * - Scene reimagine generation
 */

const BRIA_API_BASE = 'https://engine.prod.bria-api.com/v1'

export class BriaService {
  private apiToken: string

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.BRIA_API_TOKEN || ''
  }

  // Training Pipeline Methods
  async createProject(name: string): Promise<string>
  async createDataset(projectId: string, name: string): Promise<string>
  async generatePrefix(imageUrls: string[]): Promise<string>
  async updateDatasetPrefix(datasetId: string, prefix: string): Promise<void>
  async uploadImageToDataset(datasetId: string, imageUrl: string): Promise<void>
  async completeDataset(datasetId: string): Promise<void>
  async createModel(datasetId: string, name: string, version?: 'max' | 'light'): Promise<string>
  async startTraining(modelId: string): Promise<void>
  async getModelStatus(modelId: string): Promise<BriaModelStatusResponse>

  // Generation Methods
  async reimagineWithScene(
    modelId: string,
    sceneImageUrl: string,
    prompt: string,
    structureStrength?: number
  ): Promise<BriaGenerationResult>

  async textToImage(
    modelId: string,
    prompt: string,
    aspectRatio?: string
  ): Promise<BriaGenerationResult>
}
```

### New File: `src/lib/services/bria-training.ts`

```typescript
/**
 * Orchestrates the complete Bria training pipeline for a character
 * Called as background job after user initiates training
 */

export class BriaTrainingOrchestrator {
  async trainCharacterModel(
    characterId: string,
    characterName: string,
    imageUrls: string[]
  ): Promise<TrainingResult> {
    // 1. Create project
    // 2. Create dataset
    // 3. Generate caption prefix from first 6 images
    // 4. Update dataset with prefix
    // 5. Upload all images
    // 6. Complete dataset
    // 7. Create model
    // 8. Start training
    // 9. Return immediately (training is async, 1-3 hours)
  }
}
```

---

## Phase 3: API Routes

### Training Endpoints

**`POST /api/ai/bria/train`** - Initiate character model training
```typescript
// Request
{
  characterId: string
  characterName: string
  imageUrls: string[]  // Min 5 images required
}

// Response
{
  success: boolean
  projectId: string
  datasetId: string
  modelId: string
  status: 'training'
}
```

**`GET /api/ai/bria/status/[modelId]`** - Check training status
```typescript
// Response
{
  status: 'created' | 'training' | 'completed' | 'failed'
  progress?: number
  error?: string
}
```

**`GET /api/ai/bria/status`** - Check Bria API availability
```typescript
// Response
{
  available: boolean
}
```

### Generation Endpoints

**`POST /api/ai/bria/reimagine`** - Insert character into scene
```typescript
// Request
{
  modelId: string
  sceneImageUrl: string
  prompt: string
  structureStrength?: number  // 0.0-1.0, default 0.6
}

// Response
{
  imageUrl: string
  seed: number
  promptUsed: string
}
```

**`POST /api/ai/bria/generate-sketches`** - Generate random character sketches
```typescript
// Request
{
  modelId: string
  count: number  // 1-8
  aspectRatio?: string
}

// Response
{
  images: Array<{ url: string; seed: number; prompt: string }>
}
```

---

## Phase 4: Character Image Generator Enhancements

### Changes to ImageGeneratorSection

1. **Increase image capacity from 4 to 10**
   - Update `MAX_CHARACTER_IMAGES` constant
   - Update UI to show 10-slot grid

2. **Add training threshold indicator**
   - Show progress bar: "X/5 images for training"
   - At 5+ images, show "Train Character Model" button

3. **Add training status display**
   - When `briaModelStatus === 'training'`: Show spinner + "Training in progress..."
   - When `briaModelStatus === 'completed'`: Show green checkmark + "Model ready"
   - When `briaModelStatus === 'failed'`: Show error + retry button

4. **Add "Random Sketches" feature**
   - Only available when `briaModelStatus === 'completed'`
   - Generates 8 random poses/expressions using text-to-image
   - Uses varied prompts: "standing heroically", "sitting casually", "action pose", etc.

### New Component: `TrainingStatusPanel`

```typescript
interface TrainingStatusPanelProps {
  character: Character
  imageCount: number
  onStartTraining: () => void
  onRetryTraining: () => void
}
```

Displays:
- Image count progress (X/5 minimum, X/10 maximum)
- Training button (enabled at 5+ images)
- Training status with appropriate icon/message
- Estimated time remaining during training

---

## Phase 5: ImageInsertPanel Redesign

### Replace Gemini with Bria

**Current Flow (Gemini):**
1. Select character → Select image → Insert into scene

**New Flow (Bria):**
1. Select character (must have trained model)
2. Adjust structure strength slider (0.0-1.0)
3. Enter optional prompt modification
4. Generate scene composition

### UI Changes

```typescript
// New modal steps
type ModalStep =
  | 'select-character'  // Only shows characters with briaModelStatus === 'completed'
  | 'configure-insert'  // Structure strength + prompt input
  | 'preview-result'    // Before/after comparison

interface InsertConfig {
  structureStrength: number  // Slider 0.0-1.0
  additionalPrompt: string   // Optional scene description
}
```

### New Features

1. **Structure Strength Slider**
   - Range: 0.0 (loose) to 1.0 (strict)
   - Default: 0.6 (balanced)
   - Visual preview of effect

2. **Prompt Enhancement**
   - Auto-prepend character's `briaCaptionPrefix`
   - User can add scene-specific details

3. **Multiple Variations**
   - Generate 2-4 variations at once
   - User selects preferred result

---

## Phase 6: Random Sketches Feature

### New Component: `RandomSketchesPanel`

Available in CharacterEditor when model is trained.

**Functionality:**
1. Click "Generate Random Sketches"
2. Generates 8 images with varied prompts:
   - "{character} standing heroically, confident pose"
   - "{character} sitting casually, relaxed expression"
   - "{character} in action, dynamic movement"
   - "{character} looking mysterious, dramatic lighting"
   - "{character} walking forward, determined expression"
   - "{character} battle ready, weapon drawn"
   - "{character} peaceful moment, soft smile"
   - "{character} intense focus, close-up portrait"
3. Display in 4x2 grid
4. User can add selected sketches to character's `imageUrls`

---

## Implementation Order

### Week 1: Foundation
1. Create database migration (`00017_bria_training.sql`)
2. Update Character type and service mappers
3. Implement `BriaService` class
4. Add `/api/ai/bria/status` endpoint

### Week 2: Training Pipeline
5. Implement `BriaTrainingOrchestrator`
6. Add `/api/ai/bria/train` endpoint
7. Add `/api/ai/bria/status/[modelId]` endpoint
8. Create `TrainingStatusPanel` component
9. Integrate into `ImageGeneratorSection`

### Week 3: Scene Insertion
10. Add `/api/ai/bria/reimagine` endpoint
11. Redesign `ImageInsertPanel` for Bria
12. Add structure strength slider
13. Add multiple variations support

### Week 4: Polish & Random Sketches
14. Add `/api/ai/bria/generate-sketches` endpoint
15. Create `RandomSketchesPanel` component
16. Add to CharacterEditor when model ready
17. Testing and refinement

---

## Environment Variables

Add to `.env.local`:
```bash
BRIA_API_TOKEN=your_bria_api_token_here
```

---

## File Structure Summary

```
src/
├── lib/
│   ├── services/
│   │   ├── bria.ts                    # NEW: Bria API client
│   │   └── bria-training.ts           # NEW: Training orchestrator
│   └── types/
│       └── character.ts               # MODIFY: Add Bria fields
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── bria/
│   │           ├── status/
│   │           │   └── route.ts       # NEW: API availability check
│   │           ├── train/
│   │           │   └── route.ts       # NEW: Start training
│   │           ├── status/
│   │           │   └── [modelId]/
│   │           │       └── route.ts   # NEW: Training status
│   │           ├── reimagine/
│   │           │   └── route.ts       # NEW: Scene composition
│   │           └── generate-sketches/
│   │               └── route.ts       # NEW: Random sketches
│   └── features/
│       └── editor/
│           └── story/
│               ├── sub_Characters/
│               │   └── components/
│               │       └── sub_ImageGenerator/
│               │           ├── TrainingStatusPanel.tsx    # NEW
│               │           └── RandomSketchesPanel.tsx    # NEW
│               └── sub_StoryCardEditor/
│                   └── components/
│                       └── sub_ContentSection/
│                           └── ImageInsertPanel.tsx       # REDESIGN
supabase/
└── migrations/
    └── 00017_bria_training.sql        # NEW
```

---

## Acceptance Criteria

1. **Character Image Capacity**
   - [x] Characters can have up to 10 images (increased from 4)
   - [x] UI displays 10-slot grid

2. **Training Workflow**
   - [x] "Train Model" button appears at 5+ images
   - [x] Training status displays correctly (pending/training/completed/failed)
   - [x] Training can be retried on failure

3. **Scene Insertion**
   - [x] Only characters with completed models shown in insert panel
   - [x] Structure strength slider works correctly
   - [x] Generated images maintain scene structure appropriately

4. **Random Sketches**
   - [x] Generates 8 varied poses/expressions
   - [x] User can add selected sketches to character

5. **Error Handling**
   - [x] Graceful fallback when Bria API unavailable
   - [x] Clear error messages for training failures
   - [x] Timeout handling for long operations
