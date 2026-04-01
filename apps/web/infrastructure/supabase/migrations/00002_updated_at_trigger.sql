-- Auto-update updated_at timestamp on row changes
-- Applies to all tables that have an updated_at column

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Organizations
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Brand profiles
CREATE TRIGGER set_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ad accounts
CREATE TRIGGER set_ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Campaigns
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ad creatives
CREATE TRIGGER set_ad_creatives_updated_at
  BEFORE UPDATE ON ad_creatives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Conversations
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
