-- ============================================================
-- MIGRATION: Doost AI Dashboard Expansion
-- Run in Supabase SQL Editor. Safe to run on existing DB.
-- ============================================================

-- 1. Extend users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- 2. Organizations (multi-tenant layer)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan_id TEXT DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_cycle_start DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Creatives
CREATE TABLE IF NOT EXISTS public.creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video', 'carousel', 'collection')) DEFAULT 'image',
  status TEXT DEFAULT 'active',
  headline TEXT,
  body_text TEXT,
  call_to_action TEXT,
  destination_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID REFERENCES public.creatives(id) ON DELETE CASCADE,
  asset_type TEXT CHECK (asset_type IN ('image', 'video', 'thumbnail')) DEFAULT 'image',
  storage_path TEXT NOT NULL,
  original_url TEXT,
  width INT,
  height INT,
  file_size INT,
  mime_type TEXT,
  ai_model TEXT,
  ai_prompt TEXT,
  credit_cost INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Daily performance data
CREATE TABLE IF NOT EXISTS public.performance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  creative_id UUID REFERENCES public.creatives(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  ctr DECIMAL(6,4),
  roas DECIMAL(8,2),
  video_views INT DEFAULT 0,
  reach INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creative_id, platform, date)
);

-- 5. Activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  action TEXT NOT NULL,
  description TEXT,
  platform TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Plans & Credits
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(8,2) NOT NULL,
  credits_monthly INT NOT NULL,
  max_ad_accounts INT,
  max_campaigns_monthly INT,
  allowed_chat_models TEXT[] NOT NULL,
  allowed_image_models TEXT[] NOT NULL,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.plans VALUES
  ('starter', 'Starter', 49.00, 500, 1, 5,
   ARRAY['claude-haiku-4-5-20251001'],
   ARRAY['flux_schnell'],
   '{"analytics": "basic"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plans VALUES
  ('growth', 'Growth', 149.00, 2500, 3, 25,
   ARRAY['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
   ARRAY['flux_schnell', 'flux_pro', 'gpt_image_1_5', 'seedream_4_5'],
   '{"analytics": "advanced", "ai_actions": true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plans VALUES
  ('scale', 'Scale', 399.00, 10000, NULL, NULL,
   ARRAY['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6'],
   ARRAY['flux_schnell', 'flux_pro', 'gpt_image_1_5', 'seedream_4_5', 'nano_banana_pro'],
   '{"analytics": "full", "ai_actions": true, "api_access": true}')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'monthly_refill', 'bonus', 'purchase',
    'ai_chat', 'image_generation', 'campaign_launch', 'creative_analysis', 'adjustment'
  )),
  model_used TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_costs (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  model TEXT,
  credit_cost INT NOT NULL,
  description TEXT
);

INSERT INTO public.credit_costs VALUES
  ('ai_chat_haiku', 'ai_chat', 'claude-haiku-4-5-20251001', 1, 'AI chat (Haiku)'),
  ('ai_chat_sonnet', 'ai_chat', 'claude-sonnet-4-6', 2, 'AI chat (Sonnet)'),
  ('ai_chat_opus', 'ai_chat', 'claude-opus-4-6', 5, 'AI chat (Opus)'),
  ('image_flux_schnell', 'image_generation', 'flux_schnell', 2, 'FLUX Schnell'),
  ('image_flux_pro', 'image_generation', 'flux_pro', 4, 'FLUX Pro'),
  ('image_seedream', 'image_generation', 'seedream_4_5', 4, 'Seedream 4.5'),
  ('image_gpt', 'image_generation', 'gpt_image_1_5', 5, 'GPT Image 1.5'),
  ('image_nano_banana', 'image_generation', 'nano_banana_pro', 8, 'Nano Banana Pro 4K'),
  ('campaign_launch', 'campaign_launch', NULL, 10, 'Campaign launch'),
  ('creative_analysis', 'creative_analysis', NULL, 3, 'AI creative analysis')
ON CONFLICT (id) DO NOTHING;

-- 7. Audiences
CREATE TABLE IF NOT EXISTS public.audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_audience_id TEXT,
  type TEXT CHECK (type IN ('custom', 'lookalike', 'saved', 'interest')),
  size_estimate INT,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  category TEXT,
  product_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_perf_daily_org ON performance_daily(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_perf_daily_creative ON performance_daily(creative_id, date);
CREATE INDEX IF NOT EXISTS idx_creatives_org ON creatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_org ON credit_ledger(organization_id, created_at DESC);

-- 10. RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read on plans
CREATE POLICY IF NOT EXISTS "Plans are public" ON public.plans FOR SELECT USING (true);
