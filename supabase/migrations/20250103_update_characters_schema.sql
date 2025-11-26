-- Migration: Update characters table for multi-image support and avatar
-- Date: 2025-01-03
-- Description: Updates character schema to support up to 4 character images and 1 avatar

-- Step 1: Add new columns for multi-image support
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_prompts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_prompt TEXT;

-- Step 2: Migrate existing data from single image to array (if data exists)
UPDATE characters 
SET 
  image_urls = CASE 
    WHEN image_url IS NOT NULL THEN ARRAY[image_url]
    ELSE '{}'
  END,
  image_prompts = CASE 
    WHEN image_prompt IS NOT NULL THEN ARRAY[image_prompt]
    ELSE '{}'
  END
WHERE image_url IS NOT NULL OR image_prompt IS NOT NULL;

-- Step 3: Drop old single image columns (after data migration)
ALTER TABLE characters 
DROP COLUMN IF EXISTS image_url,
DROP COLUMN IF EXISTS image_prompt;

-- Step 4: Add constraints
-- Ensure image_urls array has at most 4 elements
ALTER TABLE characters 
ADD CONSTRAINT check_max_images CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 4);

-- Ensure image_prompts array matches image_urls length
ALTER TABLE characters 
ADD CONSTRAINT check_prompts_match_images CHECK (
  array_length(image_urls, 1) IS NULL AND array_length(image_prompts, 1) IS NULL
  OR array_length(image_urls, 1) = array_length(image_prompts, 1)
);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN characters.image_urls IS 'Array of up to 4 character full-body image URLs';
COMMENT ON COLUMN characters.image_prompts IS 'Array of prompts used to generate corresponding images';
COMMENT ON COLUMN characters.avatar_url IS 'Small RPG-style avatar image URL';
COMMENT ON COLUMN characters.avatar_prompt IS 'Prompt used to generate the avatar';

-- Step 6: Create index for faster lookups on stories with characters having images
CREATE INDEX IF NOT EXISTS idx_characters_has_images ON characters ((array_length(image_urls, 1) > 0));
CREATE INDEX IF NOT EXISTS idx_characters_has_avatar ON characters (avatar_url) WHERE avatar_url IS NOT NULL;
