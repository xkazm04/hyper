-- Stacks table
CREATE TABLE stacks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{
    "theme": "classic",
    "defaultCardId": null,
    "allowComments": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Card',
  order_index INTEGER NOT NULL DEFAULT 0,
  background_color TEXT DEFAULT '#FFFFFF',
  background_image TEXT,
  script TEXT, -- onLoad event script
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Elements table
CREATE TABLE elements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'button', 'text', 'image', 'input', 'shape'
  order_index INTEGER NOT NULL DEFAULT 0,
  position JSONB NOT NULL DEFAULT '{
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 40
  }'::jsonb,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb, -- style, content, etc.
  script TEXT, -- onClick, onChange event script
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'image', 'audio', 'video'
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stacks_owner ON stacks(owner_id);
CREATE INDEX idx_stacks_public ON stacks(is_public) WHERE is_public = true;
CREATE INDEX idx_cards_stack ON cards(stack_id);
CREATE INDEX idx_cards_order ON cards(stack_id, order_index);
CREATE INDEX idx_elements_card ON elements(card_id);
CREATE INDEX idx_elements_order ON elements(card_id, order_index);
CREATE INDEX idx_assets_stack ON assets(stack_id);

-- Enable RLS
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stacks
CREATE POLICY "Users can view own stacks"
  ON stacks FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public stacks"
  ON stacks FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create own stacks"
  ON stacks FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own stacks"
  ON stacks FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own stacks"
  ON stacks FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for cards
CREATE POLICY "Users can view cards in accessible stacks"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = cards.stack_id
      AND (stacks.owner_id = auth.uid() OR stacks.is_public = true)
    )
  );

CREATE POLICY "Users can create cards in own stacks"
  ON cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = cards.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in own stacks"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = cards.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards in own stacks"
  ON cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = cards.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- RLS Policies for elements (similar pattern to cards)
CREATE POLICY "Users can view elements in accessible cards"
  ON elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN stacks ON stacks.id = cards.stack_id
      WHERE cards.id = elements.card_id
      AND (stacks.owner_id = auth.uid() OR stacks.is_public = true)
    )
  );

CREATE POLICY "Users can manage elements in own stacks"
  ON elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN stacks ON stacks.id = cards.stack_id
      WHERE cards.id = elements.card_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- RLS Policies for assets
CREATE POLICY "Users can view assets in accessible stacks"
  ON assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = assets.stack_id
      AND (stacks.owner_id = auth.uid() OR stacks.is_public = true)
    )
  );

CREATE POLICY "Users can manage assets in own stacks"
  ON assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = assets.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_stacks_updated_at
  BEFORE UPDATE ON stacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elements_updated_at
  BEFORE UPDATE ON elements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reorder cards when one is deleted
CREATE OR REPLACE FUNCTION reorder_cards_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cards
  SET order_index = order_index - 1
  WHERE stack_id = OLD.stack_id
  AND order_index > OLD.order_index;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_cards_after_delete
  AFTER DELETE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION reorder_cards_on_delete();

-- Similar function for elements
CREATE OR REPLACE FUNCTION reorder_elements_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE elements
  SET order_index = order_index - 1
  WHERE card_id = OLD.card_id
  AND order_index > OLD.order_index;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_elements_after_delete
  AFTER DELETE ON elements
  FOR EACH ROW
  EXECUTE FUNCTION reorder_elements_on_delete();
