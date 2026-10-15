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

-- =============================================================================
-- NEW: Profile Company + Series registry (aluminium_series)
-- =============================================================================
-- Replicates the original "Aluminium Coating" (Company | Series) and
-- "Aluminium StockLength" (Company | Series | Available Length) settings pages,
-- which are really ONE registry of profile companies + series. This feeds the
-- designer's series/track selection and the per-panel BOM costing (see gap.md).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.aluminium_series (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company TEXT NOT NULL,
  series_name TEXT NOT NULL,
  available_length TEXT,                 -- e.g. '16 Ft' (free text, as in original)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS aluminium_series_owner_idx
  ON public.aluminium_series (created_by);

ALTER TABLE public.aluminium_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluminium_series_select" ON public.aluminium_series
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "aluminium_series_insert" ON public.aluminium_series
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "aluminium_series_update" ON public.aluminium_series
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "aluminium_series_delete" ON public.aluminium_series
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());
