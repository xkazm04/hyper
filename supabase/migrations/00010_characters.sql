-- Drop existing table if it exists (in case of partial previous migration)
DROP TABLE IF EXISTS characters CASCADE;
DROP FUNCTION IF EXISTS update_characters_updated_at() CASCADE;

-- Create characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_stack_id UUID NOT NULL REFERENCES story_stacks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  appearance TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_prompt TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_characters_story_stack_id ON characters(story_stack_id);
CREATE INDEX idx_characters_order_index ON characters(order_index);

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read characters from their own story stacks or published story stacks
CREATE POLICY "Users can view characters from their own stacks"
  ON characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = characters.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view characters from published stacks"
  ON characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = characters.story_stack_id
      AND story_stacks.is_published = true
    )
  );

-- Users can insert characters into their own story stacks
CREATE POLICY "Users can create characters in their own stacks"
  ON characters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = characters.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can update characters in their own story stacks
CREATE POLICY "Users can update characters in their own stacks"
  ON characters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = characters.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can delete characters from their own story stacks
CREATE POLICY "Users can delete characters from their own stacks"
  ON characters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = characters.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_characters_updated_at();
