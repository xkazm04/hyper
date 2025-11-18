-- Add embeddings support for AI-powered stack recommendations

-- Create table for storing stack embeddings
CREATE TABLE IF NOT EXISTS stack_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI ada-002 produces 1536-dimensional vectors
  metadata JSONB, -- Store additional metadata like tags, description snippets, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stack_id)
);

-- Create table for storing card embeddings
CREATE TABLE IF NOT EXISTS card_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id)
);

-- Create table for user interaction tracking (for collaborative filtering)
CREATE TABLE IF NOT EXISTS user_stack_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'create', 'clone', 'like', 'edit'
  interaction_count INTEGER DEFAULT 1,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stack_id, interaction_type)
);

-- Create indexes for fast similarity search
CREATE INDEX IF NOT EXISTS idx_stack_embeddings_stack_id ON stack_embeddings(stack_id);
CREATE INDEX IF NOT EXISTS idx_card_embeddings_card_id ON card_embeddings(card_id);
CREATE INDEX IF NOT EXISTS idx_card_embeddings_stack_id ON card_embeddings(stack_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_stack_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_stack_id ON user_stack_interactions(stack_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_last_interaction ON user_stack_interactions(last_interaction_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_stack_embeddings_updated_at
  BEFORE UPDATE ON stack_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_embeddings_updated_at
  BEFORE UPDATE ON card_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE stack_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stack_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stack_embeddings (read-only for authenticated users)
CREATE POLICY "Users can view all stack embeddings"
  ON stack_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own stack embeddings"
  ON stack_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = stack_embeddings.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own stack embeddings"
  ON stack_embeddings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = stack_embeddings.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own stack embeddings"
  ON stack_embeddings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = stack_embeddings.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- RLS Policies for card_embeddings (read-only for authenticated users)
CREATE POLICY "Users can view all card embeddings"
  ON card_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own card embeddings"
  ON card_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = card_embeddings.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own card embeddings"
  ON card_embeddings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = card_embeddings.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own card embeddings"
  ON card_embeddings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = card_embeddings.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- RLS Policies for user_stack_interactions
CREATE POLICY "Users can view their own interactions"
  ON user_stack_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own interactions"
  ON user_stack_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interactions"
  ON user_stack_interactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own interactions"
  ON user_stack_interactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to increment interaction count
CREATE OR REPLACE FUNCTION increment_interaction(
  p_user_id UUID,
  p_stack_id UUID,
  p_interaction_type VARCHAR(50)
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stack_interactions (user_id, stack_id, interaction_type, interaction_count, last_interaction_at)
  VALUES (p_user_id, p_stack_id, p_interaction_type, 1, NOW())
  ON CONFLICT (user_id, stack_id, interaction_type)
  DO UPDATE SET
    interaction_count = user_stack_interactions.interaction_count + 1,
    last_interaction_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
