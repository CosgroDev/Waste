-- ============================================================
-- FridgeFlow – initial schema
-- All tables are prefixed with ff_ to coexist with HACCP
-- tables in the same Supabase project. Auth is shared via
-- the existing auth.users table.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE ff_storage_location AS ENUM ('fridge', 'freezer', 'cupboard');
CREATE TYPE ff_expiry_type      AS ENUM ('use_by', 'best_before', 'unknown');
CREATE TYPE ff_item_status      AS ENUM ('active', 'consumed', 'discarded');
CREATE TYPE ff_item_source      AS ENUM ('barcode_scan', 'manual_entry');

-- ── ff_inventory_items ───────────────────────────────────────
CREATE TABLE ff_inventory_items (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barcode             TEXT,
    product_name        TEXT        NOT NULL,
    brand               TEXT,
    category            TEXT,
    image_url           TEXT,
    storage_location    ff_storage_location NOT NULL,
    expiry_type         ff_expiry_type      NOT NULL DEFAULT 'unknown',
    expiry_date         DATE,
    original_expiry_date DATE,
    frozen_date         DATE,
    quantity            TEXT,
    notes               TEXT,
    status              ff_item_status      NOT NULL DEFAULT 'active',
    source              ff_item_source      NOT NULL DEFAULT 'manual_entry',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-level security – users can only touch their own items
ALTER TABLE ff_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ff_items: owner full access"
    ON ff_inventory_items
    FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── ff_recipe_requests ───────────────────────────────────────
-- Lightweight audit trail for recipe generation calls
CREATE TABLE ff_recipe_requests (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_context_json  JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ff_recipe_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ff_recipe_requests: owner full access"
    ON ff_recipe_requests
    FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION ff_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER ff_inventory_items_updated_at
    BEFORE UPDATE ON ff_inventory_items
    FOR EACH ROW EXECUTE FUNCTION ff_set_updated_at();

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_ff_items_user_status
    ON ff_inventory_items (user_id, status);

CREATE INDEX idx_ff_items_user_expiry
    ON ff_inventory_items (user_id, expiry_date)
    WHERE status = 'active';

CREATE INDEX idx_ff_items_barcode
    ON ff_inventory_items (barcode)
    WHERE barcode IS NOT NULL;
