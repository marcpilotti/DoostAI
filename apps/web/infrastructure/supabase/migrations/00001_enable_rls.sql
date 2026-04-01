-- ===================================
-- Doost AI — Row Level Security
-- Tenant isolation for all org-scoped tables
-- ===================================

-- Helper: extract current org_id from JWT claims or session setting
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    -- JWT claim (Supabase client / PostgREST access)
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'org_id')::uuid,
    -- App session variable (server-side Drizzle access)
    (nullif(current_setting('app.current_org_id', true), ''))::uuid
  );
$$;

-- ─── Enable RLS ───

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_performance ENABLE ROW LEVEL SECURITY;

-- ─── Isolation policies ───
-- service_role key bypasses RLS automatically in Supabase.
-- These policies apply to anon/authenticated roles only.

CREATE POLICY "brand_profiles_org_isolation" ON brand_profiles
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "ad_accounts_org_isolation" ON ad_accounts
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "campaigns_org_isolation" ON campaigns
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "ad_creatives_org_isolation" ON ad_creatives
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "conversations_org_isolation" ON conversations
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "creative_performance_org_isolation" ON creative_performance
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());
