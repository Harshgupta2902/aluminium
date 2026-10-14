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
-- FEATURE: Extend accessory kinds for mesh / slim / casement hardware
-- =============================================================================
-- Adds the extra accessory kinds the editor now configures per window/panel:
--   mesh_type, mesh_sash, mesh_clip, mesh_handle, mesh_slim  (when mesh is on)
--   reinforcement, slim_interlock                            (slim sliding)
--   friction_stay                                            (casement/top-hung)
-- Replaces the existing CHECK constraint on design_accessories.kind.
-- =============================================================================

ALTER TABLE public.design_accessories
  DROP CONSTRAINT IF EXISTS design_accessories_kind_check;

ALTER TABLE public.design_accessories
  ADD CONSTRAINT design_accessories_kind_check CHECK (kind IN (
    'sash','interlock','handle','roller','lock','hinge','mesh',
    'mesh_type','mesh_sash','mesh_clip','mesh_handle','mesh_slim',
    'reinforcement','slim_interlock','friction_stay'
  ));
