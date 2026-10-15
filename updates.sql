-- =============================================================================
-- DATABASE UPDATES
-- =============================================================================
-- This file contains incremental database changes.
--
-- WORKFLOW (ALWAYS FOLLOW):
-- 1. Add new SQL changes HERE (never edit supabase_setup.sql directly)
-- 2. Copy and paste THIS FILE's content into Supabase SQL Editor
-- 3. After successful execution, merge changes into supabase_setup.sql
-- 4. Clear this file (reset to "No pending updates")
-- =============================================================================

-- STATUS: PENDING - Copy to Supabase SQL Editor

-- =============================================================================
-- Phase 1 — persist the per-section BOM breakdown on each design
-- =============================================================================
-- The weight-based BOM engine produces a per-section cost breakdown (weight,
-- aluminium/coating/glass/hardware/labour, profiles cut-list). Store it so the
-- quotation + cutting list can show the real line items, like the original's
-- `panel_details`/`data` arrays.
-- =============================================================================
ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS panel_details JSONB;
