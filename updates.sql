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
-- SECURITY FIX — prevent self privilege-escalation on profiles
-- =============================================================================
-- The previous profiles_update policy allowed a user to update their OWN row
-- with no column restriction, so a user could PATCH their own
-- role => 'superadmin' / is_active / access flags directly via the REST API
-- (anon key + their own token). This locks it down: a non-superadmin may edit
-- their own row ONLY IF the admin-controlled columns are left unchanged.
-- Superadmins can still change anything.
-- =============================================================================

-- Guard function: SECURITY DEFINER reads the caller's CURRENT admin-controlled
-- values so the WITH CHECK can confirm they weren't altered by a non-superadmin.
CREATE OR REPLACE FUNCTION public.profile_admin_fields_unchanged(
  p_id UUID,
  p_role TEXT,
  p_is_active BOOLEAN,
  p_can_designs BOOLEAN,
  p_can_billing BOOLEAN,
  p_can_inventory BOOLEAN
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_id
      AND role = p_role
      AND is_active = p_is_active
      AND can_access_designs = p_can_designs
      AND can_access_billing = p_can_billing
      AND can_access_inventory = p_can_inventory
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_superadmin())
  WITH CHECK (
    public.is_superadmin()
    OR (
      auth.uid() = id
      AND public.profile_admin_fields_unchanged(
        id, role, is_active,
        can_access_designs, can_access_billing, can_access_inventory
      )
    )
  );

-- =============================================================================
-- SELF-SERVICE ONBOARDING + PLAN CATALOG + LEADS (no payment gateway)
-- =============================================================================
-- Flow:
--   1. Visitor signs up on /signup and picks a PLAN.
--      -> An auth account is created with profiles.account_status = 'pending_review'.
--      -> A LEAD row is created (status 'new') linking the user to the chosen plan.
--   2. Superadmin reviews leads in /dashboard/admin/leads, contacts the user,
--      then clicks "Generate billing" -> creates a billing_period from the plan.
--   3. Superadmin marks the billing period PAID -> the lead is 'won' and the
--      account_status flips to 'active'. The user's dashboard unlocks.
--   Until 'active', the user can log in but is locked to a pending dashboard;
--   every action is blocked server-side (not just hidden).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) PLANS: the catalog, defined once by the superadmin.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  -- How long one billing period lasts.
  billing_interval TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
  -- Quotation allowance per period (NULL = unlimited).
  quotation_limit INTEGER,
  -- Feature flags mirror the profiles access flags; applied when billing is generated.
  can_access_designs BOOLEAN NOT NULL DEFAULT TRUE,
  can_access_billing BOOLEAN NOT NULL DEFAULT TRUE,
  can_access_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  -- Marketing / ordering.
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,  -- show on the public signup page
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS plans_active_idx ON public.plans (is_active, is_public, sort_order);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous visitors on the signup page) may read ACTIVE PUBLIC
-- plans. Superadmin reads everything. Only superadmin writes.
DROP POLICY IF EXISTS "plans_select_public" ON public.plans;
CREATE POLICY "plans_select_public" ON public.plans
  FOR SELECT USING ((is_active = TRUE AND is_public = TRUE) OR public.is_superadmin());
DROP POLICY IF EXISTS "plans_write" ON public.plans;
CREATE POLICY "plans_write" ON public.plans
  FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- 2) profiles.account_status: gates the whole app for a user.
--    pending_review -> account created, waiting for superadmin to process the
--                      lead + mark billing paid. User is LOCKED.
--    active         -> unlocked, normal usage.
--    rejected       -> signup declined. Treated like inactive.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('pending_review', 'active', 'rejected'));

-- Existing users keep 'active' (the default). New self-signups are set to
-- 'pending_review' explicitly by the signup server action.

-- account_status is an admin-controlled column: a non-superadmin must not be
-- able to self-activate. Extend the guard + reinstate the update policy.
CREATE OR REPLACE FUNCTION public.profile_admin_fields_unchanged(
  p_id UUID,
  p_role TEXT,
  p_is_active BOOLEAN,
  p_can_designs BOOLEAN,
  p_can_billing BOOLEAN,
  p_can_inventory BOOLEAN,
  p_account_status TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_id
      AND role = p_role
      AND is_active = p_is_active
      AND can_access_designs = p_can_designs
      AND can_access_billing = p_can_billing
      AND can_access_inventory = p_can_inventory
      AND account_status = p_account_status
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_superadmin())
  WITH CHECK (
    public.is_superadmin()
    OR (
      auth.uid() = id
      AND public.profile_admin_fields_unchanged(
        id, role, is_active,
        can_access_designs, can_access_billing, can_access_inventory,
        account_status
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3) LEADS: one per self-signup. The superadmin's manual sales pipeline.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- The auth account created at signup (so we can activate it later).
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  plan_name TEXT,          -- snapshot of the plan name at signup
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'billing_sent', 'won', 'rejected')),
  notes TEXT,
  -- Set once billing is generated for this lead.
  billing_period_id UUID REFERENCES public.billing_periods(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads (user_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- A freshly-signed-up user (authenticated, owns the row) may INSERT their own
-- lead and read it. Superadmin reads/writes everything. No public anon insert:
-- the signup server action runs as the newly-created user's session (isolated
-- client), so user_id = auth.uid() holds.
DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT USING (user_id = auth.uid() OR public.is_superadmin());
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_superadmin());
DROP POLICY IF EXISTS "leads_update" ON public.leads;
CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE USING (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- 4) handle_new_user: honor account_status passed in signup metadata so the
--    self-signup flow starts users as 'pending_review'. Admin-created users
--    (via the admin console) pass no status -> default 'active'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, phone, role, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'user'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_status', ''), 'active')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 5) Seed a few starter plans (idempotent on name).
-- ---------------------------------------------------------------------------
INSERT INTO public.plans (name, description, price, billing_interval, quotation_limit, sort_order)
SELECT * FROM (VALUES
  ('Starter',  'For small shops getting started.',        999,  'monthly', 25,   1),
  ('Business', 'For growing window & door businesses.',   2499, 'monthly', 150,  2),
  ('Unlimited','Unlimited quotations for larger teams.',  4999, 'monthly', NULL, 3)
) AS v(name, description, price, billing_interval, quotation_limit, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.plans p WHERE p.name = v.name);

-- ---------------------------------------------------------------------------
-- 6) SERVER-SIDE LOCK (database-enforced): a user whose account is NOT 'active'
--    (i.e. pending_review or rejected) must not be able to CREATE or MODIFY any
--    data — even by calling the REST API directly with their own token and
--    bypassing the UI. We bake the check into the WITH CHECK / USING clauses of
--    every user-writable table's write policies.
--
--    Superadmin bypasses everything. SELECT is left untouched so a pending user
--    can still read their (empty) workspace behind the pending dashboard.
-- ---------------------------------------------------------------------------

-- True when the caller's account is fully active (or superadmin). SECURITY
-- DEFINER to read profiles.account_status without recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'superadmin' OR account_status = 'active')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper to (re)apply owner+active write policies on a created_by-owned table.
DO $$
DECLARE
  t TEXT;
  owner_col TEXT;
BEGIN
  -- tables keyed by created_by
  FOREACH t IN ARRAY ARRAY[
    'clients','window_designs','quotations','invoices','quotation_cost_heads',
    'design_accessories','aluminium_series','series_profiles'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK ((created_by = auth.uid() AND public.is_account_active()) OR public.is_superadmin())',
      t || '_insert', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING ((created_by = auth.uid() AND public.is_account_active()) OR public.is_superadmin())',
      t || '_update', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING ((created_by = auth.uid() AND public.is_account_active()) OR public.is_superadmin())',
      t || '_delete', t
    );
  END LOOP;
END $$;

-- aluminium_cost_settings is keyed by user_id and has no DELETE policy.
DROP POLICY IF EXISTS "aluminium_cost_settings_insert" ON public.aluminium_cost_settings;
DROP POLICY IF EXISTS "aluminium_cost_settings_update" ON public.aluminium_cost_settings;
CREATE POLICY "aluminium_cost_settings_insert" ON public.aluminium_cost_settings
  FOR INSERT WITH CHECK ((user_id = auth.uid() AND public.is_account_active()) OR public.is_superadmin());
CREATE POLICY "aluminium_cost_settings_update" ON public.aluminium_cost_settings
  FOR UPDATE USING ((user_id = auth.uid() AND public.is_account_active()) OR public.is_superadmin());
