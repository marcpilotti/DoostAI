-- ===================================
-- Doost AI — RLS for Intelligence Tables
-- Extends 00001_enable_rls.sql to cover
-- all remaining org-scoped tables
-- ===================================

-- ─── Enable RLS ───

ALTER TABLE social_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_audits ENABLE ROW LEVEL SECURITY;

-- ─── Isolation policies ───

CREATE POLICY "social_presence_org_isolation" ON social_presence
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "google_reviews_org_isolation" ON google_reviews
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "competitor_tracking_org_isolation" ON competitor_tracking
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "competitor_ads_org_isolation" ON competitor_ads
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "behavior_signals_org_isolation" ON behavior_signals
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "profile_triggers_org_isolation" ON profile_triggers
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());

CREATE POLICY "website_audits_org_isolation" ON website_audits
  FOR ALL
  USING (org_id = public.get_current_org_id())
  WITH CHECK (org_id = public.get_current_org_id());
