-- Add nested stacks support
-- This migration enables composable nested stacks for modular reuse

-- Create stack_references table to track which stacks are embedded in other stacks
CREATE TABLE stack_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  child_stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  position JSONB NOT NULL DEFAULT '{
    "x": 0,
    "y": 0,
    "width": 800,
    "height": 600
  }'::jsonb,
  -- Configuration for the embedded stack
  config JSONB DEFAULT '{
    "isolateState": true,
    "isolateStyles": true,
    "passthrough": {}
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add nested_stack_id field to elements table to support stack elements
ALTER TABLE elements ADD COLUMN nested_stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE;

-- Add a check constraint to ensure either type is 'nested_stack' OR nested_stack_id is NULL
ALTER TABLE elements ADD CONSTRAINT check_nested_stack
  CHECK (
    (type = 'nested_stack' AND nested_stack_id IS NOT NULL) OR
    (type != 'nested_stack' AND nested_stack_id IS NULL)
  );

-- Create indexes for performance
CREATE INDEX idx_stack_references_parent ON stack_references(parent_stack_id);
CREATE INDEX idx_stack_references_child ON stack_references(child_stack_id);
CREATE INDEX idx_stack_references_card ON stack_references(card_id);
CREATE INDEX idx_elements_nested_stack ON elements(nested_stack_id) WHERE nested_stack_id IS NOT NULL;

-- Enable RLS on stack_references
ALTER TABLE stack_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stack_references
CREATE POLICY "Users can view stack references in accessible stacks"
  ON stack_references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = stack_references.parent_stack_id
      AND (stacks.owner_id = auth.uid() OR stacks.is_public = true)
    )
  );

CREATE POLICY "Users can manage stack references in own stacks"
  ON stack_references FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = stack_references.parent_stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_stack_references_updated_at
  BEFORE UPDATE ON stack_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reorder stack references when one is deleted
CREATE OR REPLACE FUNCTION reorder_stack_references_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stack_references
  SET order_index = order_index - 1
  WHERE card_id = OLD.card_id
  AND order_index > OLD.order_index;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_stack_references_after_delete
  AFTER DELETE ON stack_references
  FOR EACH ROW
  EXECUTE FUNCTION reorder_stack_references_on_delete();

-- Function to prevent circular stack references
CREATE OR REPLACE FUNCTION check_circular_stack_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if adding this reference would create a circular dependency
  IF EXISTS (
    WITH RECURSIVE stack_tree AS (
      -- Start with the child stack
      SELECT child_stack_id as stack_id
      FROM stack_references
      WHERE parent_stack_id = NEW.child_stack_id

      UNION

      -- Recursively find all nested stacks
      SELECT sr.child_stack_id
      FROM stack_references sr
      INNER JOIN stack_tree st ON sr.parent_stack_id = st.stack_id
    )
    SELECT 1 FROM stack_tree WHERE stack_id = NEW.parent_stack_id
  ) THEN
    RAISE EXCEPTION 'Circular stack reference detected: stack % cannot be nested because it would create a circular dependency', NEW.child_stack_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_reference_before_insert
  BEFORE INSERT OR UPDATE ON stack_references
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_stack_reference();

-- Add comment for documentation
COMMENT ON TABLE stack_references IS 'Tracks nested stack relationships for composable modular reuse';
COMMENT ON COLUMN elements.nested_stack_id IS 'References a nested stack when element type is nested_stack';
