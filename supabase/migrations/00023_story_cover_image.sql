-- Add cover image support for story stacks
-- This migration adds a cover_image_url column to store AI-generated or uploaded cover images

ALTER TABLE story_stacks
ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN story_stacks.cover_image_url IS 'URL of the story cover image (AI-generated or uploaded)';
