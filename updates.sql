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
-- FEATURE: Per-section accessory configuration + aluminium cost settings
-- =============================================================================
-- Lets a user configure the hardware/accessories (sash, interlock, handle,
-- roller, lock, hinge, mesh) and the aluminium cost heads, then pick them per
-- window section in the editor. All data is per-user (owner RLS + superadmin
-- override), consistent with the rest of the app.
-- =============================================================================

-- 1) TYPED ACCESSORIES ---------------------------------------------------------
-- One row per accessory option. `kind` groups them so the editor can show the
-- right dropdown (Sash / Interlock / Handle / Roller / Lock / Hinge / Mesh).
CREATE TABLE IF NOT EXISTS public.design_accessories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN (
    'sash','interlock','handle','roller','lock','hinge','mesh'
  )),
  name TEXT NOT NULL,
  code TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS design_accessories_owner_kind_idx
  ON public.design_accessories (created_by, kind);

-- 2) ALUMINIUM COST SETTINGS ---------------------------------------------------
-- One row per user holding the aluminium cost heads used to price a window.
-- Values mirror the reference "Aluminium Setting" cost sheet.
CREATE TABLE IF NOT EXISTS public.aluminium_cost_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluminium_rate NUMERIC NOT NULL DEFAULT 0,      -- Rs / Kg
  profit_percentage NUMERIC NOT NULL DEFAULT 0,   -- %
  labour_charge NUMERIC NOT NULL DEFAULT 0,       -- Rs / Sqft
  coating NUMERIC NOT NULL DEFAULT 0,             -- Rs / Kg
  corner_cleat NUMERIC NOT NULL DEFAULT 0,        -- Rs / qty
  weather_strip NUMERIC NOT NULL DEFAULT 0,       -- Rs / meter
  ss_corner_con NUMERIC NOT NULL DEFAULT 0,       -- Rs / piece
  screw NUMERIC NOT NULL DEFAULT 0,               -- Rs / piece
  rail NUMERIC NOT NULL DEFAULT 0,                -- Rs / meter
  fastner NUMERIC NOT NULL DEFAULT 0,             -- Rs / piece
  -- Overlaps (mm) that affect cut sizes; used by the BOM engine later.
  slider_width_overlap NUMERIC NOT NULL DEFAULT 25,
  slider_height_overlap NUMERIC NOT NULL DEFAULT 18,
  slider_glass_overlap NUMERIC NOT NULL DEFAULT 16,
  casement_width_overlap NUMERIC NOT NULL DEFAULT 12,
  casement_height_overlap NUMERIC NOT NULL DEFAULT 12,
  casement_glass_overlap NUMERIC NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3) RLS -----------------------------------------------------------------------
ALTER TABLE public.design_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluminium_cost_settings ENABLE ROW LEVEL SECURITY;

-- Accessories: owner reads/writes own rows; superadmin all.
CREATE POLICY "design_accessories_select" ON public.design_accessories
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "design_accessories_insert" ON public.design_accessories
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "design_accessories_update" ON public.design_accessories
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "design_accessories_delete" ON public.design_accessories
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());

-- Cost settings: owner reads/writes own row; superadmin all.
CREATE POLICY "aluminium_cost_settings_select" ON public.aluminium_cost_settings
  FOR SELECT USING (user_id = auth.uid() OR public.is_superadmin());
CREATE POLICY "aluminium_cost_settings_insert" ON public.aluminium_cost_settings
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_superadmin());
CREATE POLICY "aluminium_cost_settings_update" ON public.aluminium_cost_settings
  FOR UPDATE USING (user_id = auth.uid() OR public.is_superadmin());
