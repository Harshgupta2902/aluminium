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
-- CLEANUP: Drop legacy tables no longer used by the app
-- =============================================================================
-- The Inventory and Designs pages were removed. These tables are not read or
-- written by any current feature (the editor uses editor_document +
-- design_* / aluminium_cost_settings; quotations/billing use their own
-- tables). Dropping is DESTRUCTIVE and irreversible — only sample/legacy data
-- lives here. RLS policies drop automatically with the tables.
-- =============================================================================

-- window_designs.template_id referenced window_templates; the new editor never
-- sets it. Drop the column before dropping the table.
ALTER TABLE public.window_designs DROP COLUMN IF EXISTS template_id;

DROP TABLE IF EXISTS public.profiles_inventory CASCADE;
DROP TABLE IF EXISTS public.glass_inventory CASCADE;
DROP TABLE IF EXISTS public.accessories CASCADE;
DROP TABLE IF EXISTS public.calculation_formulas CASCADE;
DROP TABLE IF EXISTS public.window_templates CASCADE;
