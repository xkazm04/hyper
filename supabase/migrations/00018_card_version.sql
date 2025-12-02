-- Migration: Add version field for optimistic concurrency control on story_cards
-- This allows detecting stale updates in multi-tab and auto-save scenarios

-- Add version column with default value of 1
ALTER TABLE story_cards
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create a trigger function to auto-increment version on each update
CREATE OR REPLACE FUNCTION increment_story_card_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to story_cards table
CREATE TRIGGER story_card_version_trigger
BEFORE UPDATE ON story_cards
FOR EACH ROW
EXECUTE FUNCTION increment_story_card_version();

-- Add comment for documentation
COMMENT ON COLUMN story_cards.version IS 'Optimistic concurrency control version number, auto-incremented on each update';
