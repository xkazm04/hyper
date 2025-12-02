-- Migration: Fix image_prompts constraint for 10 images
-- Date: 2025-12-02
-- Description: Ensures image prompts constraint works correctly with up to 10 images
-- This migration re-applies the constraint fixes from 00017 in case they weren't applied

-- Drop existing constraints (both old and new versions to ensure clean state)
ALTER TABLE characters
DROP CONSTRAINT IF EXISTS check_max_images;

ALTER TABLE characters
DROP CONSTRAINT IF EXISTS check_prompts_match_images;

-- Re-add constraint for max 10 images
ALTER TABLE characters
ADD CONSTRAINT check_max_images CHECK (
  array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 10
);

-- Re-add constraint for prompts matching images
-- This constraint allows:
-- 1. Both arrays to be NULL or empty
-- 2. Both arrays to have the same length (up to 10)
ALTER TABLE characters
ADD CONSTRAINT check_prompts_match_images CHECK (
  (array_length(image_urls, 1) IS NULL AND array_length(image_prompts, 1) IS NULL)
  OR (coalesce(array_length(image_urls, 1), 0) = coalesce(array_length(image_prompts, 1), 0))
);

-- Update documentation comments
COMMENT ON COLUMN characters.image_urls IS 'Array of up to 10 character image URLs for training';
COMMENT ON COLUMN characters.image_prompts IS 'Array of prompts used to generate corresponding images (must match image_urls length)';
