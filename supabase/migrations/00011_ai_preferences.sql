-- ============================================================================
-- AI Preferences Migration
-- ============================================================================
-- This migration adds tables for storing AI prediction preferences and
-- user interaction patterns for the infinite canvas AI co-creator feature.
-- ============================================================================

-- User AI Preferences table - stores learned user preferences
CREATE TABLE user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Preference weights (0.0 - 1.0)
  style_weights JSONB DEFAULT '{}'::JSONB,
  -- Theme/mood preferences
  theme_preferences JSONB DEFAULT '{}'::JSONB,
  -- Card structure preferences (avg content length, choice count, etc.)
  structure_preferences JSONB DEFAULT '{}'::JSONB,
  -- Declined suggestion patterns (to avoid repeating)
  declined_patterns JSONB DEFAULT '[]'::JSONB,
  -- Accepted suggestion patterns (to reinforce)
  accepted_patterns JSONB DEFAULT '[]'::JSONB,
  -- Total interactions for learning weight
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Suggestion History - tracks suggestions and outcomes
CREATE TABLE ai_suggestion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_stack_id UUID REFERENCES story_stacks(id) ON DELETE CASCADE NOT NULL,
  source_card_id UUID REFERENCES story_cards(id) ON DELETE CASCADE,
  -- The suggestion that was made
  suggestion_type TEXT NOT NULL, -- 'card', 'choice', 'content', 'image_prompt'
  suggestion_data JSONB NOT NULL,
  -- Confidence level (0.0 - 1.0)
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
  -- Outcome
  outcome TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'modified'
  -- If modified, store what the user actually used
  final_data JSONB,
  -- Position on canvas when suggested
  canvas_position JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_user_ai_preferences_user ON user_ai_preferences(user_id);
CREATE INDEX idx_ai_suggestion_history_user ON ai_suggestion_history(user_id);
CREATE INDEX idx_ai_suggestion_history_stack ON ai_suggestion_history(story_stack_id);
CREATE INDEX idx_ai_suggestion_history_outcome ON ai_suggestion_history(outcome) WHERE outcome != 'pending';

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for user_ai_preferences
-- ============================================================================

CREATE POLICY "Users can view their own preferences"
  ON user_ai_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON user_ai_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_ai_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_ai_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for ai_suggestion_history
-- ============================================================================

CREATE POLICY "Users can view their own suggestion history"
  ON ai_suggestion_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suggestion history"
  ON ai_suggestion_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestion history"
  ON ai_suggestion_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestion history"
  ON ai_suggestion_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_user_ai_preferences_updated_at
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE user_ai_preferences IS 'Stores learned AI preferences for each user to personalize suggestions';
COMMENT ON TABLE ai_suggestion_history IS 'Tracks AI suggestions and their outcomes for continuous learning';
COMMENT ON COLUMN user_ai_preferences.style_weights IS 'JSON object with writing style preferences (formal, casual, dramatic, etc.)';
COMMENT ON COLUMN user_ai_preferences.theme_preferences IS 'JSON object with preferred themes and moods';
COMMENT ON COLUMN ai_suggestion_history.confidence IS 'How confident the AI was in this suggestion (0.0-1.0)';
