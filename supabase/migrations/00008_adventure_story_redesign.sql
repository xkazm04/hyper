-- ============================================================================
-- Adventure Story System Redesign Migration
-- ============================================================================
-- This migration transforms the generic HyperCard system into a focused
-- adventure story creation platform by:
-- 1. Creating new simplified tables (story_stacks, story_cards, choices)
-- 2. Setting up Row Level Security policies
-- 3. Creating performance indexes
-- 4. Dropping old unused tables
-- ============================================================================

-- ============================================================================
-- PART 1: Create New Simplified Tables
-- ============================================================================

-- Story Stacks table (replaces stacks)
CREATE TABLE story_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  slug TEXT UNIQUE,
  first_card_id UUID,  -- Entry point for the story
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story Cards table (replaces cards)
CREATE TABLE story_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_stack_id UUID REFERENCES story_stacks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Scene',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_prompt TEXT,  -- Prompt used to generate the image
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Choices table (replaces elements - button type only)
CREATE TABLE choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_card_id UUID REFERENCES story_cards(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  target_card_id UUID REFERENCES story_cards(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Create Indexes for Performance Optimization
-- ============================================================================

-- Indexes for story_stacks
CREATE INDEX idx_story_stacks_owner ON story_stacks(owner_id);
CREATE INDEX idx_story_stacks_slug ON story_stacks(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_story_stacks_published ON story_stacks(is_published, published_at) WHERE is_published = TRUE;

-- Indexes for story_cards
CREATE INDEX idx_story_cards_stack ON story_cards(story_stack_id);
CREATE INDEX idx_story_cards_order ON story_cards(story_stack_id, order_index);

-- Indexes for choices
CREATE INDEX idx_choices_card ON choices(story_card_id);
CREATE INDEX idx_choices_target ON choices(target_card_id) WHERE target_card_id IS NOT NULL;
CREATE INDEX idx_choices_order ON choices(story_card_id, order_index);

-- ============================================================================
-- PART 3: Enable Row Level Security
-- ============================================================================

ALTER TABLE story_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: RLS Policies for story_stacks
-- ============================================================================

-- Users can view their own stacks
CREATE POLICY "Users can view their own stacks"
  ON story_stacks FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can view published stacks
CREATE POLICY "Users can view published stacks"
  ON story_stacks FOR SELECT
  USING (is_published = TRUE);

-- Users can create their own stacks
CREATE POLICY "Users can create their own stacks"
  ON story_stacks FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own stacks
CREATE POLICY "Users can update their own stacks"
  ON story_stacks FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own stacks
CREATE POLICY "Users can delete their own stacks"
  ON story_stacks FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- PART 5: RLS Policies for story_cards
-- ============================================================================

-- Users can view cards from their stacks or published stacks
CREATE POLICY "Users can view cards from accessible stacks"
  ON story_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_cards.story_stack_id
      AND (story_stacks.owner_id = auth.uid() OR story_stacks.is_published = TRUE)
    )
  );

-- Users can create cards in their own stacks
CREATE POLICY "Users can create cards in their own stacks"
  ON story_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can update cards in their own stacks
CREATE POLICY "Users can update cards in their own stacks"
  ON story_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can delete cards in their own stacks
CREATE POLICY "Users can delete cards in their own stacks"
  ON story_cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 6: RLS Policies for choices
-- ============================================================================

-- Users can view choices from accessible cards
CREATE POLICY "Users can view choices from accessible cards"
  ON choices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_cards
      JOIN story_stacks ON story_stacks.id = story_cards.story_stack_id
      WHERE story_cards.id = choices.story_card_id
      AND (story_stacks.owner_id = auth.uid() OR story_stacks.is_published = TRUE)
    )
  );

-- Users can create choices in their own stacks
CREATE POLICY "Users can create choices in their own stacks"
  ON choices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_cards
      JOIN story_stacks ON story_stacks.id = story_cards.story_stack_id
      WHERE story_cards.id = choices.story_card_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can update choices in their own stacks
CREATE POLICY "Users can update choices in their own stacks"
  ON choices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM story_cards
      JOIN story_stacks ON story_stacks.id = story_cards.story_stack_id
      WHERE story_cards.id = choices.story_card_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can delete choices in their own stacks
CREATE POLICY "Users can delete choices in their own stacks"
  ON choices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM story_cards
      JOIN story_stacks ON story_stacks.id = story_cards.story_stack_id
      WHERE story_cards.id = choices.story_card_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 7: Create Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_story_stacks_updated_at
  BEFORE UPDATE ON story_stacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_cards_updated_at
  BEFORE UPDATE ON story_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_choices_updated_at
  BEFORE UPDATE ON choices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: Utility Functions
-- ============================================================================

-- Function to generate unique slug for story stacks
CREATE OR REPLACE FUNCTION generate_story_slug(story_name TEXT, story_id UUID)
RETURNS TEXT AS $
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(story_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If slug is empty, use 'story'
  IF base_slug = '' THEN
    base_slug := 'story';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM story_stacks WHERE slug = final_slug AND id != story_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$ LANGUAGE plpgsql;

-- Function to reorder cards when one is deleted
CREATE OR REPLACE FUNCTION reorder_story_cards_on_delete()
RETURNS TRIGGER AS $
BEGIN
  UPDATE story_cards
  SET order_index = order_index - 1
  WHERE story_stack_id = OLD.story_stack_id
  AND order_index > OLD.order_index;
  RETURN OLD;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_story_cards_after_delete
  AFTER DELETE ON story_cards
  FOR EACH ROW
  EXECUTE FUNCTION reorder_story_cards_on_delete();

-- Function to reorder choices when one is deleted
CREATE OR REPLACE FUNCTION reorder_choices_on_delete()
RETURNS TRIGGER AS $
BEGIN
  UPDATE choices
  SET order_index = order_index - 1
  WHERE story_card_id = OLD.story_card_id
  AND order_index > OLD.order_index;
  RETURN OLD;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_choices_after_delete
  AFTER DELETE ON choices
  FOR EACH ROW
  EXECUTE FUNCTION reorder_choices_on_delete();

-- ============================================================================
-- PART 9: Drop Old Unused Tables
-- ============================================================================
-- Note: This will permanently delete all data in these tables.
-- Ensure you have backups if needed before running this migration.
-- ============================================================================

-- Drop tables in reverse dependency order to avoid foreign key conflicts

-- Drop marketplace-related tables
DROP TABLE IF EXISTS package_reviews CASCADE;
DROP TABLE IF EXISTS package_installations CASCADE;
DROP TABLE IF EXISTS package_versions CASCADE;
DROP TABLE IF EXISTS packages CASCADE;

-- Drop embeddings-related tables
DROP TABLE IF EXISTS user_stack_interactions CASCADE;
DROP TABLE IF EXISTS card_embeddings CASCADE;
DROP TABLE IF EXISTS stack_embeddings CASCADE;

-- Drop nested stacks table
DROP TABLE IF EXISTS stack_references CASCADE;

-- Drop deployments table
DROP TABLE IF EXISTS deployments CASCADE;

-- Drop old core tables (elements, assets, cards, stacks)
DROP TABLE IF EXISTS elements CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS stacks CASCADE;

-- Drop unused functions
DROP FUNCTION IF EXISTS generate_stack_slug(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_package_slug(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_package_downloads(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_package_rating() CASCADE;
DROP FUNCTION IF EXISTS increment_interaction(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS check_circular_stack_reference() CASCADE;
DROP FUNCTION IF EXISTS reorder_stack_references_on_delete() CASCADE;
DROP FUNCTION IF EXISTS reorder_cards_on_delete() CASCADE;
DROP FUNCTION IF EXISTS reorder_elements_on_delete() CASCADE;
DROP FUNCTION IF EXISTS update_deployments_updated_at() CASCADE;

-- ============================================================================
-- PART 10: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE story_stacks IS 'Adventure story collections - simplified from generic stacks';
COMMENT ON TABLE story_cards IS 'Individual story scenes with text and images';
COMMENT ON TABLE choices IS 'Navigation choices that link story cards together';

COMMENT ON COLUMN story_stacks.first_card_id IS 'Entry point card for the story';
COMMENT ON COLUMN story_stacks.slug IS 'Unique URL-friendly identifier for published stories';
COMMENT ON COLUMN story_cards.image_prompt IS 'AI prompt used to generate the card image';
COMMENT ON COLUMN choices.target_card_id IS 'The story card this choice navigates to';

-- ============================================================================
-- Migration Complete
-- ============================================================================
