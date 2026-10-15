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
-- Phase 1 — weight-based BOM: add weight_per_meter to series_profiles
-- =============================================================================
-- Aluminium profiles are sold by weight. Each profile has a fixed cross-section
-- so a constant kg per running metre. The BOM engine computes:
--   aluminium_cost = Σ (cut_length_m × weight_per_meter) × aluminium_rate
-- Seeded with industry-standard group defaults; editable per profile in the
-- Aluminium Coating settings page so users can calibrate to their supplier.
-- =============================================================================
ALTER TABLE public.series_profiles
  ADD COLUMN IF NOT EXISTS weight_per_meter NUMERIC NOT NULL DEFAULT 0;

-- Backfill existing rows with group defaults (kg/m) where still 0.
UPDATE public.series_profiles SET weight_per_meter = CASE profile_group
  WHEN 'track'          THEN 1.00
  WHEN 'sash'           THEN 0.75
  WHEN 'mesh_sash'      THEN 0.55
  WHEN 'interlock'      THEN 0.60
  WHEN 'slim_interlock' THEN 0.45
  WHEN 'slim_huricane'  THEN 0.50
  WHEN 'mullion'        THEN 1.10
  WHEN 'clip'           THEN 0.30
  WHEN 'mesh_clip'      THEN 0.25
  WHEN 'outer_top'      THEN 1.00
  WHEN 'outer_left'     THEN 1.00
  ELSE 0.60
END
WHERE weight_per_meter = 0;
