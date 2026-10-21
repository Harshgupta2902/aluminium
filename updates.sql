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
