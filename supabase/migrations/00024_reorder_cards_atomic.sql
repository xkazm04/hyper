-- Add atomic card reordering RPC function
-- This ensures all card order updates happen in a single transaction
-- preventing partial updates from race conditions

-- Create the reorder_story_cards function
CREATE OR REPLACE FUNCTION reorder_story_cards(
  p_story_stack_id UUID,
  p_card_orders JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_order JSONB;
  v_card_id UUID;
  v_order_index INTEGER;
  v_updated_count INTEGER := 0;
  v_existing_key TEXT;
BEGIN
  -- Check idempotency if key provided
  IF p_idempotency_key IS NOT NULL THEN
    -- Check if this operation was already performed
    SELECT idempotency_key INTO v_existing_key
    FROM card_reorder_idempotency
    WHERE idempotency_key = p_idempotency_key
      AND story_stack_id = p_story_stack_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_existing_key IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'updated_count', 0,
        'idempotent', true,
        'message', 'Operation already completed'
      );
    END IF;
  END IF;

  -- Verify all cards belong to the story stack before updating
  FOR v_card_order IN SELECT * FROM jsonb_array_elements(p_card_orders)
  LOOP
    v_card_id := (v_card_order->>'id')::UUID;

    IF NOT EXISTS (
      SELECT 1 FROM story_cards
      WHERE id = v_card_id AND story_stack_id = p_story_stack_id
    ) THEN
      RAISE EXCEPTION 'Card % does not belong to story stack %', v_card_id, p_story_stack_id;
    END IF;
  END LOOP;

  -- Perform all updates in this transaction
  FOR v_card_order IN SELECT * FROM jsonb_array_elements(p_card_orders)
  LOOP
    v_card_id := (v_card_order->>'id')::UUID;
    v_order_index := (v_card_order->>'orderIndex')::INTEGER;

    UPDATE story_cards
    SET
      order_index = v_order_index,
      updated_at = NOW()
    WHERE id = v_card_id
      AND story_stack_id = p_story_stack_id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Record idempotency key if provided
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO card_reorder_idempotency (idempotency_key, story_stack_id, card_count)
    VALUES (p_idempotency_key, p_story_stack_id, v_updated_count)
    ON CONFLICT (idempotency_key, story_stack_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'idempotent', false,
    'message', 'Cards reordered successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    RETURN jsonb_build_object(
      'success', false,
      'updated_count', 0,
      'idempotent', false,
      'message', SQLERRM
    );
END;
$$;

-- Create idempotency tracking table
CREATE TABLE IF NOT EXISTS card_reorder_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  story_stack_id UUID NOT NULL REFERENCES story_stacks(id) ON DELETE CASCADE,
  card_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idempotency_key, story_stack_id)
);

-- Create index for efficient lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_card_reorder_idempotency_lookup
ON card_reorder_idempotency(idempotency_key, story_stack_id, created_at);

-- Create cleanup function to remove old idempotency records
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_records()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM card_reorder_idempotency
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Add RLS policies for the idempotency table
ALTER TABLE card_reorder_idempotency ENABLE ROW LEVEL SECURITY;

-- Users can only see their own idempotency records (through story ownership)
CREATE POLICY "Users can view own idempotency records" ON card_reorder_idempotency
  FOR SELECT USING (
    story_stack_id IN (
      SELECT id FROM story_stacks WHERE owner_id = auth.uid()
    )
  );

-- Users can insert idempotency records for their stories
CREATE POLICY "Users can insert idempotency records" ON card_reorder_idempotency
  FOR INSERT WITH CHECK (
    story_stack_id IN (
      SELECT id FROM story_stacks WHERE owner_id = auth.uid()
    )
  );

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION reorder_story_cards TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_idempotency_records TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION reorder_story_cards IS 'Atomically reorder story cards with idempotency support to prevent race conditions';
COMMENT ON TABLE card_reorder_idempotency IS 'Tracks idempotency keys for card reorder operations to prevent duplicate submissions';
