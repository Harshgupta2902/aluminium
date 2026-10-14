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
-- FEATURE: Quotation-level pricing (cost overheads + price summary)
-- =============================================================================
-- Design amounts are now PRE-TAX. GST / installation / overheads are applied
-- once per quotation here. Adds overhead columns to quotations + a child table
-- for arbitrary custom cost heads.
-- =============================================================================

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS profit_percentage NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installation_charge NUMERIC NOT NULL DEFAULT 0,   -- Rs / Sqft
  ADD COLUMN IF NOT EXISTS labour_charge NUMERIC NOT NULL DEFAULT 0,         -- Rs / Sqft
  ADD COLUMN IF NOT EXISTS profile_wastage NUMERIC NOT NULL DEFAULT 0,       -- %
  ADD COLUMN IF NOT EXISTS glass_wastage NUMERIC NOT NULL DEFAULT 0,         -- %
  ADD COLUMN IF NOT EXISTS transport_charge NUMERIC NOT NULL DEFAULT 0,      -- Rs flat
  ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage'
    CHECK (discount_type IN ('percentage','fixed')),
  ADD COLUMN IF NOT EXISTS cgst NUMERIC NOT NULL DEFAULT 9,                  -- %
  ADD COLUMN IF NOT EXISTS sgst NUMERIC NOT NULL DEFAULT 9,                  -- %
  ADD COLUMN IF NOT EXISTS igst NUMERIC NOT NULL DEFAULT 0,                  -- %
  ADD COLUMN IF NOT EXISTS gst_mode TEXT NOT NULL DEFAULT 'cgst_sgst'
    CHECK (gst_mode IN ('cgst_sgst','igst','none')),
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC NOT NULL DEFAULT 0;

-- Arbitrary custom cost-head line items for a quotation.
CREATE TABLE IF NOT EXISTS public.quotation_cost_heads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS quotation_cost_heads_quotation_idx
  ON public.quotation_cost_heads (quotation_id);

ALTER TABLE public.quotation_cost_heads ENABLE ROW LEVEL SECURITY;

-- Owner (via the parent quotation's creator) or superadmin.
CREATE POLICY "quotation_cost_heads_select" ON public.quotation_cost_heads
  FOR SELECT USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "quotation_cost_heads_insert" ON public.quotation_cost_heads
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "quotation_cost_heads_update" ON public.quotation_cost_heads
  FOR UPDATE USING (created_by = auth.uid() OR public.is_superadmin());
CREATE POLICY "quotation_cost_heads_delete" ON public.quotation_cost_heads
  FOR DELETE USING (created_by = auth.uid() OR public.is_superadmin());
