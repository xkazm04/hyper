-- Migration: Add Bria AI Tailored Generation support to characters
-- Date: 2025-12-01
-- Description: Extends character image capacity to 10 and adds Bria training state tracking

-- Step 1: Extend character image capacity from 4 to 10
ALTER TABLE characters
DROP CONSTRAINT IF EXISTS check_max_images;

ALTER TABLE characters
ADD CONSTRAINT check_max_images CHECK (
  array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 10
);

-- Update prompts constraint to match new capacity
ALTER TABLE characters
DROP CONSTRAINT IF EXISTS check_prompts_match_images;

ALTER TABLE characters
ADD CONSTRAINT check_prompts_match_images CHECK (
  (array_length(image_urls, 1) IS NULL AND array_length(image_prompts, 1) IS NULL)
  OR array_length(image_urls, 1) = array_length(image_prompts, 1)
);

-- Step 2: Add Bria training fields to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS bria_project_id TEXT,
ADD COLUMN IF NOT EXISTS bria_dataset_id TEXT,
ADD COLUMN IF NOT EXISTS bria_model_id TEXT,
ADD COLUMN IF NOT EXISTS bria_model_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS bria_caption_prefix TEXT,
ADD COLUMN IF NOT EXISTS bria_training_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bria_training_completed_at TIMESTAMPTZ;

-- Step 3: Add index for characters with trained models
CREATE INDEX IF NOT EXISTS idx_characters_bria_model
ON characters (bria_model_id)
WHERE bria_model_id IS NOT NULL;

-- Step 4: Add check constraint for valid Bria statuses
ALTER TABLE characters
ADD CONSTRAINT check_bria_status CHECK (
  bria_model_status IN ('none', 'pending', 'training', 'completed', 'failed')
);

-- Step 5: Add documentation comments
COMMENT ON COLUMN characters.image_urls IS 'Array of up to 10 character image URLs for training';
COMMENT ON COLUMN characters.bria_project_id IS 'Bria Tailored Gen project ID';
COMMENT ON COLUMN characters.bria_dataset_id IS 'Bria Tailored Gen dataset ID';
COMMENT ON COLUMN characters.bria_model_id IS 'Bria Tailored Gen trained model ID';
COMMENT ON COLUMN characters.bria_model_status IS 'Training status: none, pending, training, completed, failed';
COMMENT ON COLUMN characters.bria_caption_prefix IS 'Auto-generated caption prefix describing the character';
COMMENT ON COLUMN characters.bria_training_started_at IS 'Timestamp when training was initiated';
COMMENT ON COLUMN characters.bria_training_completed_at IS 'Timestamp when training completed successfully';
