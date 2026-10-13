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
-- 
-- See DATABASE_WORKFLOW.md for detailed instructions.
-- See .kiro/steering/database-rules.md for AI assistant rules.
-- =============================================================================

-- STATUS: PENDING - Copy to Supabase SQL Editor

-- =============================================================================
-- FEATURE: Link quotations to their designs (quotation owns many designs)
-- =============================================================================
-- A quotation is now a collection of window designs. Each design belongs to a
-- quotation and carries its own computed area (sq ft), rate per sq ft, and
-- amount so the quotation listing can aggregate SUM(area)/SUM(amount) cheaply
-- and the view/PDF can render per-design totals without recomputing.
--
--   quotation_id   -> which quotation this design belongs to (nullable so the
--                     standalone /design editor still works without a quote)
--   area_sqft      -> total glass area across all windows in the design
--   rate_per_sqft  -> user-entered rate used to price the design
--   amount         -> area_sqft * rate_per_sqft (persisted for aggregation)
--   sort_order      -> display order of designs within a quotation
-- =============================================================================

ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE;

ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS area_sqft NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS rate_per_sqft NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Fast lookup of all designs for a quotation.
CREATE INDEX IF NOT EXISTS window_designs_quotation_id_idx
  ON public.window_designs (quotation_id);

-- =============================================================================
-- FEATURE: Professional section-based design editor — configurable lists
-- =============================================================================
-- The design editor lets users pick Glass, Colour, and GI hardware (Track /
-- Sash / Interlock / Lock) from editable lists, and prices designs with a
-- configurable base rate per window type plus GST and installation percentages.
-- All of these live in Supabase so they can be managed from Settings.
--
-- Shared columns on every list table:
--   name          -> display label
--   is_active     -> hide without deleting
--   is_default    -> preselected option
--   sort_order    -> display order
-- =============================================================================

-- Glass options (e.g. "5MM CLEAR TOUGHENED GLASS").
CREATE TABLE IF NOT EXISTS public.design_glasses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_sqft NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Colour / finish options (e.g. "White", "Wood Finish"). hex optional for UI.
CREATE TABLE IF NOT EXISTS public.design_colors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  hex TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- GI hardware lists (galvanized iron sections). profile_code is the shop code.
CREATE TABLE IF NOT EXISTS public.gi_tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gi_sashes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gi_interlocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gi_locks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Pricing config: one base rate per window type + global GST / install %.
-- A single row of global settings, plus per-type base rates keyed by window type.
CREATE TABLE IF NOT EXISTS public.design_type_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  window_type TEXT NOT NULL UNIQUE,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.design_pricing_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  gst_percentage NUMERIC NOT NULL DEFAULT 18,
  install_percentage NUMERIC NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT design_pricing_config_singleton CHECK (id = 1)
);

-- RLS: authenticated users can read; manage (write) for authenticated users.
ALTER TABLE public.design_glasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gi_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gi_sashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gi_interlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gi_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_type_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_pricing_config ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'design_glasses','design_colors','gi_tracks','gi_sashes',
    'gi_interlocks','gi_locks','design_type_rates','design_pricing_config'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')',
      t || '_select', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')',
      t || '_write', t
    );
  END LOOP;
END $$;

-- Seed glasses (from the editor's glass list).
INSERT INTO public.design_glasses (name, is_default, sort_order) VALUES
  ('4MM CLEAR GLASS', FALSE, 1),
  ('5MM CLEAR GLASS', TRUE, 2),
  ('5MM CLEAR TOUGHENED GLASS', FALSE, 3),
  ('6MM TINTED GLASS', FALSE, 4),
  ('6MM TOUGHENED GLASS', FALSE, 5),
  ('8MM TOUGHENED GLASS', FALSE, 6),
  ('DOUBLE GLAZED UNIT', FALSE, 7)
ON CONFLICT DO NOTHING;

-- Seed colours.
INSERT INTO public.design_colors (name, hex, is_default, sort_order) VALUES
  ('White', '#ffffff', TRUE, 1),
  ('Black', '#1a1a1a', FALSE, 2),
  ('Grey', '#8a8a8a', FALSE, 3),
  ('Brown', '#5a3a22', FALSE, 4),
  ('Bronze', '#8c7853', FALSE, 5),
  ('Wood Finish', '#9c6b3f', FALSE, 6),
  ('Anodized', '#b7b7b7', FALSE, 7)
ON CONFLICT DO NOTHING;

-- Seed GI hardware with a couple of sensible defaults each.
INSERT INTO public.gi_tracks (name, is_default, sort_order) VALUES
  ('2 Track', TRUE, 1), ('3 Track', FALSE, 2), ('Slim Track', FALSE, 3)
ON CONFLICT DO NOTHING;
INSERT INTO public.gi_sashes (name, is_default, sort_order) VALUES
  ('Standard Sash', TRUE, 1), ('Slim Sash', FALSE, 2)
ON CONFLICT DO NOTHING;
INSERT INTO public.gi_interlocks (name, is_default, sort_order) VALUES
  ('Standard Interlock', TRUE, 1), ('Slim Interlock', FALSE, 2)
ON CONFLICT DO NOTHING;
INSERT INTO public.gi_locks (name, is_default, sort_order) VALUES
  ('SLD TOUCH LOCK LEFT', TRUE, 1),
  ('SLD TOUCH LOCK RIGHT', FALSE, 2),
  ('Mortise Lock', FALSE, 3)
ON CONFLICT DO NOTHING;

-- Seed per-type base rates (from the editor's Dv table).
INSERT INTO public.design_type_rates (window_type, base_rate, sort_order) VALUES
  ('fixed', 850, 1),
  ('sliding', 1100, 2),
  ('casement', 1350, 3),
  ('double-casement', 1350, 4),
  ('fixed-casement', 1200, 5),
  ('tophung', 1250, 6),
  ('louvered', 950, 7),
  ('awning', 1200, 8),
  ('door-single', 2500, 9),
  ('door-double', 4200, 10),
  ('ventilator', 700, 11),
  ('exhaust-fan', 600, 12),
  ('exhaust-fan-rect', 600, 13),
  ('ac-sleeve', 800, 14),
  ('glass-block', 900, 15),
  ('georgian-bars', 1000, 16),
  ('roller-shutter', 1400, 17),
  ('skylight', 1600, 18),
  ('grille', 750, 19),
  ('mesh-screen', 500, 20),
  ('roller-blind', 650, 21),
  ('fly-screen', 500, 22),
  ('frosted-film', 300, 23)
ON CONFLICT (window_type) DO NOTHING;

-- Seed the single pricing-config row.
INSERT INTO public.design_pricing_config (id, gst_percentage, install_percentage)
VALUES (1, 18, 10)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FIX: Profile creation fails with RLS error 42501 on signup
-- =============================================================================
-- Root cause: profiles table has RLS enabled but NO INSERT policy.
-- Fix: (1) Auto-create profile via SECURITY DEFINER trigger on auth.users
--      (2) Add INSERT policy as a safety net for client-side inserts
-- =============================================================================

-- 1) Safety-net INSERT policy: users can insert their own profile row
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2) Trigger function to auto-create a profile when a new auth user is created.
--    SECURITY DEFINER lets it bypass RLS. Pulls full_name/company_name from the
--    signup metadata (options.data) passed by the client.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'company_name',
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Trigger that runs after each new auth user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- FEATURE: Interactive window design editor
-- =============================================================================
-- The /design/[id] editor stores a full canvas document (multiple window
-- shapes + design detail fields). Add a single JSONB column to hold that
-- document without disturbing the existing single-window columns.
-- =============================================================================

-- Full editor document: { details: {...}, shapes: [...] }
ALTER TABLE public.window_designs
  ADD COLUMN IF NOT EXISTS editor_document JSONB;

-- =============================================================================
-- FIX: FK violation "quotations_created_by_fkey" (and the same for designs,
--      invoices, clients) — the logged-in auth user has no row in profiles.
-- =============================================================================
-- The on_auth_user_created trigger only fills profiles for NEW signups.
-- Existing auth users created before the trigger have no profile row, so any
-- insert with created_by = auth.uid() fails the foreign key to profiles(id).
--
-- Backfill a profile row for every existing auth user that is missing one.
-- Safe to run multiple times (ON CONFLICT DO NOTHING). full_name is NOT NULL,
-- so fall back to the email local-part when no name metadata exists.
-- =============================================================================

INSERT INTO public.profiles (id, email, full_name, company_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    split_part(u.email, '@', 1)
  ),
  u.raw_user_meta_data->>'company_name',
  'admin'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
