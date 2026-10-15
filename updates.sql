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
-- T0.4a — Complete the aluminium cost sheet
-- =============================================================================
-- Add the remaining cost heads from the original "Aluminium Setting" page that
-- had no column yet. Units (from the original) noted in comments. All default 0
-- except slim_width_overlap (mm) which mirrors slider_width_overlap's default.
-- =============================================================================
ALTER TABLE public.aluminium_cost_settings
  ADD COLUMN IF NOT EXISTS dustpad NUMERIC NOT NULL DEFAULT 0,          -- Rs / Meter
  ADD COLUMN IF NOT EXISTS outer_clit NUMERIC NOT NULL DEFAULT 0,       -- Rs / Piece
  ADD COLUMN IF NOT EXISTS sash_clit NUMERIC NOT NULL DEFAULT 0,        -- Rs / Piece (Shutter Clit)
  ADD COLUMN IF NOT EXISTS l_pati NUMERIC NOT NULL DEFAULT 0,           -- Rs / Piece
  ADD COLUMN IF NOT EXISTS lockguide_cap NUMERIC NOT NULL DEFAULT 0,    -- Rs / Piece
  ADD COLUMN IF NOT EXISTS interlock_cap NUMERIC NOT NULL DEFAULT 0,    -- Rs / Piece
  ADD COLUMN IF NOT EXISTS bubstopper NUMERIC NOT NULL DEFAULT 0,       -- Rs / Piece
  ADD COLUMN IF NOT EXISTS ugid NUMERIC NOT NULL DEFAULT 0,             -- Rs / Piece
  ADD COLUMN IF NOT EXISTS lockguid NUMERIC NOT NULL DEFAULT 0,         -- Rs / Piece
  ADD COLUMN IF NOT EXISTS water_drainage NUMERIC NOT NULL DEFAULT 0,   -- Rs / Piece
  ADD COLUMN IF NOT EXISTS brassrubber NUMERIC NOT NULL DEFAULT 0,      -- Rs / Meter (Brush Rubber)
  ADD COLUMN IF NOT EXISTS suitbelt NUMERIC NOT NULL DEFAULT 0,         -- Rs / Piece (Suit Bolt)
  ADD COLUMN IF NOT EXISTS slim_width_overlap NUMERIC NOT NULL DEFAULT 25; -- mm
