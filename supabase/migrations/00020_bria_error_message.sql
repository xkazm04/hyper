-- Migration: Add error message field to Bria training
-- Date: 2025-12-04
-- Description: Adds bria_error_message column to store training failure details

-- Add error message column
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS bria_error_message TEXT;

-- Add documentation comment
COMMENT ON COLUMN characters.bria_error_message IS 'Error message when training fails';
