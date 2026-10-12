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
