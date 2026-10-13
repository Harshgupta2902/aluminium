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
-- FEATURE: Admin-managed multi-user system
-- =============================================================================
-- Turns the single-user app into a superadmin-managed, per-user tenant model:
--   * a `superadmin` manages everyone from an admin panel
--   * every other user is a plain `user` and sees ONLY their own data
--   * each user has account flags (active, section permissions) and a current
--     billing period that carries their quotation limit + expiry date
--
-- Run this whole file in the Supabase SQL Editor.
-- =============================================================================

-- 1) ROLES ---------------------------------------------------------------------
-- Allow the new roles. (Drop the old CHECK, add one that includes superadmin+user.)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'admin', 'user', 'sales', 'accounts'));

-- 2) PER-USER ACCOUNT FLAGS ----------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_access_designs BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_access_billing BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_access_inventory BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3) BILLING PERIODS -----------------------------------------------------------
-- Each row is one billing cycle for a user. The ACTIVE period is the one whose
-- [starts_at, ends_at] range contains today. It carries the quotation limit
-- (NULL = unlimited) that resets each period, and acts as the account expiry.
CREATE TABLE IF NOT EXISTS public.billing_periods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'Standard',
  amount NUMERIC NOT NULL DEFAULT 0,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at DATE NOT NULL,
  quotation_limit INTEGER, -- NULL = unlimited
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS billing_periods_user_id_idx
  ON public.billing_periods (user_id);
CREATE INDEX IF NOT EXISTS billing_periods_range_idx
  ON public.billing_periods (user_id, starts_at, ends_at);

-- 4) SUPERADMIN HELPER ---------------------------------------------------------
-- SECURITY DEFINER so it can read profiles.role without being blocked by RLS
-- (and without causing recursive policy evaluation).
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5) RLS REWRITE — per-user ownership, superadmin override ----------------------
-- Helper note: every policy below allows the row's owner (created_by = auth.uid())
-- OR a superadmin. Catalog/config tables: all users read; only superadmin writes.

-- profiles: a user sees/updates own row; superadmin sees/manages all.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_superadmin());
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_superadmin());
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_superadmin());
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (public.is_superadmin());

-- clients
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());

-- window_designs
DROP POLICY IF EXISTS "Authenticated users can view all designs" ON public.window_designs;
DROP POLICY IF EXISTS "Authenticated users can create designs" ON public.window_designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON public.window_designs;

CREATE POLICY "designs_select" ON public.window_designs
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "designs_insert" ON public.window_designs
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "designs_update" ON public.window_designs
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "designs_delete" ON public.window_designs
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());

-- quotations
DROP POLICY IF EXISTS "Authenticated users can view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated users can create quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;

CREATE POLICY "quotations_select" ON public.quotations
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "quotations_insert" ON public.quotations
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "quotations_update" ON public.quotations
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "quotations_delete" ON public.quotations
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());

-- invoices
DROP POLICY IF EXISTS "Authenticated users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can create invoices" ON public.invoices;

CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "invoices_delete" ON public.invoices
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());

-- billing_periods: a user reads own; only superadmin writes.
ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_periods_select" ON public.billing_periods
  FOR SELECT USING (user_id = auth.uid() OR public.is_superadmin());
CREATE POLICY "billing_periods_write" ON public.billing_periods
  FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Design catalog + pricing config: all authenticated users may READ (needed by
-- the editor); only the superadmin may WRITE. Replace the old open ALL policies.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'design_glasses','design_colors','gi_tracks','gi_sashes',
    'gi_interlocks','gi_locks','design_type_rates','design_pricing_config'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_write', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')',
      t || '_select', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin())',
      t || '_write', t
    );
  END LOOP;
END $$;

-- 6) NEW USERS DEFAULT TO ROLE 'user' ------------------------------------------
-- The trigger previously hardcoded 'admin' for everyone. New self-created rows
-- (and admin-created accounts, before the admin sets their role) default to
-- 'user'. The superadmin seed below promotes admin@gmail.com explicitly.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'company_name',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) SUPERADMIN SEED -----------------------------------------------------------
-- Promote admin@gmail.com to superadmin. Idempotent and works whether the auth
-- user exists yet or not:
--   * if the profile row exists, promote it;
--   * if the auth user exists but has no profile (edge case), create it.
-- NOTE: this sets the PROFILE role only. The LOGIN (email + password) must be
-- created in Supabase Auth separately — see the comment block at the bottom.
UPDATE public.profiles
  SET role = 'superadmin', is_active = TRUE
  WHERE email = 'admin@gmail.com';

INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT u.id, u.email, 'Super Admin', 'superadmin', TRUE
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@gmail.com' AND p.id IS NULL
ON CONFLICT (id) DO UPDATE SET role = 'superadmin', is_active = TRUE;

-- =============================================================================
-- CREATE THE SUPERADMIN LOGIN (do this once, in the Supabase Dashboard):
--   Authentication → Users → Add user →
--     Email: admin@gmail.com   Password: admin@gmail.com
--     ✅ Auto Confirm User
-- The on_auth_user_created trigger will create its profile; the seed above
-- (re-run anytime) promotes it to superadmin.
-- =============================================================================
