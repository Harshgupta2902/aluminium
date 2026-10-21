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
-- AUDIT LOGS — who did what, when
-- =============================================================================
-- Two sources feed this table:
--   (A) App-level: server actions call logAudit() for rich events
--       (login, logout, email.sent, pdf.generated, …) with full context.
--   (C) DB-level: a trigger auto-logs INSERT/UPDATE/DELETE on key tables, so
--       even direct REST/curl writes are captured.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,                 -- denormalized so logs survive user deletion
  action TEXT NOT NULL,            -- e.g. 'quotation.create', 'login', 'email.sent'
  entity_type TEXT,                -- 'quotation' | 'design' | 'client' | ...
  entity_id TEXT,                  -- affected row id (text: ids are uuids)
  source TEXT NOT NULL DEFAULT 'app',  -- 'app' | 'db'
  metadata JSONB,                  -- extra context (amounts, names, changed cols)
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users may read their OWN logs; superadmin reads everything.
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid() OR public.is_superadmin());

-- App-level inserts: a user may insert a log row attributed to themselves.
-- (The DB-trigger path uses SECURITY DEFINER and bypasses RLS.)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_superadmin());

-- No UPDATE/DELETE policies → the log is append-only for everyone
-- (superadmin can still purge via the service role / SQL editor if ever needed).

-- =============================================================================
-- (C) DB trigger — auto-log INSERT/UPDATE/DELETE on key tables
-- =============================================================================
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_entity_id TEXT;
  v_email TEXT;
BEGIN
  v_action := TG_TABLE_NAME || '.' || lower(TG_OP);  -- e.g. 'quotations.insert'
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id::TEXT;
  ELSE
    v_entity_id := NEW.id::TEXT;
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, source)
  VALUES (auth.uid(), v_email, v_action, TG_TABLE_NAME, v_entity_id, 'db');

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to the business tables whose direct writes we want captured.
DROP TRIGGER IF EXISTS audit_quotations ON public.quotations;
CREATE TRIGGER audit_quotations
  AFTER INSERT OR UPDATE OR DELETE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_window_designs ON public.window_designs;
CREATE TRIGGER audit_window_designs
  AFTER INSERT OR UPDATE OR DELETE ON public.window_designs
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_clients ON public.clients;
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
