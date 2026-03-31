# DOOST AI — DASHBOARD EXPANSION

> Drop this file in the project root. Claude Code: read this entire file before doing anything.

## What Doost AI is today

A conversational AI marketing platform. Users paste a company URL → we scrape brand identity → enrich with company data → generate ready-to-publish ad campaigns for Meta, Google, LinkedIn — all through a chat interface.

**Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres EU Frankfurt), Vercel AI SDK + Claude Sonnet 4, Tailwind + shadcn/ui, Zustand + React Query, Framer Motion, Recharts, Inngest, Stripe, Meta Marketing API v21, Puppeteer.

**Existing DB tables:** users, ad_accounts, campaigns, ad_variants, campaign_metrics, ai_conversations, ai_tool_logs. All have RLS.

**Existing UI:** Chat-first. ChatView is the main interface. 17 tool system with confirmation pattern for destructive actions. Inline widgets (CampaignCard, ChartWidget, AdPreview, ConfirmationCard, SuggestionChips, CampaignEditor).

## What we are building now

We are expanding Doost AI from a chat-only app into a full visual dashboard platform. The chat stays — but becomes a slide-out AI panel on the right side, while the main content area gets dedicated pages: Home dashboard, Creatives grid, Campaigns list, Analytics, etc.

The target UI is a clean, light, minimal design. Think: white backgrounds, subtle borders, Inter font, dark active states in sidebar. Not the current Kampanjify "Warm Scandinavian Fintech" aesthetic — this is a new, more neutral product design.

We are also adding:
- Multi-model AI image generation (FLUX, GPT Image 1.5, Nano Banana Pro, Seedream)
- A credits system with monthly refill and tiered access to models
- A creative studio for generating ad images with AI

---

## DESIGN TOKENS

Apply these throughout. Override any existing theme colors with these.

```css
:root {
  /* Backgrounds */
  --doost-bg: #FFFFFF;
  --doost-bg-secondary: #F7F7F5;
  --doost-bg-card: #FFFFFF;
  --doost-bg-sidebar: #FFFFFF;
  --doost-bg-active: #1A1A1A;
  --doost-bg-ai-panel: #F7F7F5;
  --doost-bg-user-msg: #E8E8E4;
  --doost-bg-kpi-highlight: #F0FAF0;
  --doost-bg-badge-review: #FFF3E0;
  --doost-bg-badge-ready: #E8F5E9;

  /* Text */
  --doost-text: #1A1A1A;
  --doost-text-secondary: #6B6B6B;
  --doost-text-muted: #9B9B9B;
  --doost-text-on-dark: #FFFFFF;
  --doost-text-positive: #2E7D32;
  --doost-text-negative: #C62828;

  /* Borders */
  --doost-border: #E5E5E3;
  --doost-border-card: #EBEBEB;
  --doost-border-input: #D5D5D3;
  --doost-border-active: #1A1A1A;

  /* Chart */
  --doost-chart-current: #2E7D32;
  --doost-chart-previous: #C8C8C8;

  /* Layout */
  --doost-sidebar-w: 200px;
  --doost-ai-panel-w: 380px;
  --doost-radius-sm: 6px;
  --doost-radius-md: 8px;
  --doost-radius-lg: 12px;
  --doost-radius-card: 10px;

  /* Typography — use Inter via next/font */
  --doost-font: 'Inter', -apple-system, sans-serif;
}
```

---

## SCHEMA MIGRATION

**DO NOT drop or modify existing tables.** Run these as additive migrations in the existing Supabase project.

```sql
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

-- 4. Daily performance data (for KPI dashboard + creative metrics)
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

-- 5. Activity log (campaign activity feed)
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
CREATE POLICY "Plans are public" ON public.plans FOR SELECT USING (true);
```

---

## NEW FILE STRUCTURE

Add these alongside existing files. Do not move or rename existing files.

```
src/
  app/
    (dashboard)/
      layout.tsx                    ← NEW: Sidebar + TopBar + AI Panel wrapper
      page.tsx                      ← NEW: Home dashboard (KPIs + chart + activity)
      analytics/page.tsx            ← NEW
      actions/page.tsx              ← NEW
      performance/page.tsx          ← NEW
      campaigns/page.tsx            ← MOVE: existing campaign logic here
      audiences/page.tsx            ← NEW
      creatives/
        page.tsx                    ← NEW: Creative grid
        studio/page.tsx             ← NEW: AI image generation studio
      products/page.tsx             ← NEW
      integrations/page.tsx         ← NEW
      wallet/page.tsx               ← NEW
      settings/page.tsx             ← NEW
    (auth)/login/page.tsx           ← KEEP as-is
    api/
      chat/route.ts                 ← KEEP: extend with model selector
      ai/
        generate-image/route.ts     ← NEW: multi-model image gen
        analyze/route.ts            ← NEW: creative analysis
      sync/
        meta/route.ts               ← NEW: Meta sync cron
        google/route.ts             ← NEW: Google sync cron
      credits/
        balance/route.ts            ← NEW
        deduct/route.ts             ← NEW
      webhooks/stripe/route.ts      ← KEEP
      webhooks/meta/route.ts        ← KEEP
  components/
    layout/
      Sidebar.tsx                   ← NEW
      TopBar.tsx                    ← NEW
      AIPanel.tsx                   ← NEW (refactor from ChatView)
      PageShell.tsx                 ← NEW
    dashboard/
      KPICard.tsx                   ← NEW
      KPIRow.tsx                    ← NEW
      ROASChart.tsx                 ← NEW
      CampaignActivity.tsx          ← NEW
      ChannelFilter.tsx             ← NEW
    creatives/
      CreativeCard.tsx              ← NEW
      CreativeGrid.tsx              ← NEW
      CreativeFilters.tsx           ← NEW
      ViewToggle.tsx                ← NEW
    credits/
      CreditBalance.tsx             ← NEW
      ModelSelector.tsx             ← NEW
      CreditGate.tsx                ← NEW
      UpgradePrompt.tsx             ← NEW
    ai/
      AIChatPanel.tsx               ← NEW (extract from ChatView)
      AIMessage.tsx                 ← NEW
      AIReasoningToggle.tsx         ← NEW
      AIInput.tsx                   ← NEW
    ChatView.tsx                    ← KEEP but refactor into AIPanel
    Sidebar.tsx                     ← KEEP old or replace
    widgets/                        ← KEEP all existing widgets
  lib/
    providers/
      fal.ts                        ← NEW: FLUX + Seedream + Nano Banana
      openai-image.ts               ← NEW: GPT Image 1.5
      model-router.ts               ← NEW: routes to correct provider
    credits/
      check.ts                      ← NEW: check balance
      deduct.ts                     ← NEW: deduct credits
      refill.ts                     ← NEW: monthly refill logic
    supabase/client.ts              ← KEEP
    supabase/server.ts              ← KEEP
    meta/api.ts                     ← KEEP
  hooks/
    useCredits.ts                   ← NEW
    useKPIs.ts                      ← NEW
    useCreatives.ts                 ← NEW
    useCampaignActivity.ts          ← NEW
    useROASChart.ts                 ← NEW
    useAIPanel.ts                   ← NEW
  tools/
    definitions.ts                  ← KEEP + extend with new tools
    executor.ts                     ← KEEP + extend
    system-prompt.ts                ← KEEP + extend with page context
```

---

## BUILD ORDER

Work through these phases sequentially. Complete each before moving to the next. After each phase, test that existing functionality still works.

### Phase 1: Layout Shell

**Goal:** Sidebar + TopBar + AI Panel wrapper. All existing pages still work.

1. Create `src/components/layout/Sidebar.tsx`
   - 200px wide, white bg, border-right
   - Logo "M" mark top-left (or Doost logo)
   - Nav items with icons (lucide-react): Home, Analytics, Actions, Performance, Campaigns, Audiences, Creatives, Products
   - Bottom section: Integrations, Wallet, Settings
   - User avatar + name + org at very bottom
   - Active state: dark bg (#1A1A1A), white text, rounded
   - Collapsed state for mobile

2. Create `src/components/layout/TopBar.tsx`
   - Search bar with ⌘K shortcut
   - "Welcome back, {user.full_name}!" text
   - Sparkle icon button (toggles AI panel)
   - Credit balance indicator (small)

3. Create `src/components/layout/AIPanel.tsx`
   - 380px wide slide-out from right
   - Refactor existing ChatView into this component
   - Keep all existing chat functionality, tool calling, streaming
   - Add: conversation title header, close button, model selector dropdown
   - Add: "Show reasoning" expandable section on AI messages

4. Create `src/app/(dashboard)/layout.tsx`
   - Wraps Sidebar + TopBar + main content area + AI Panel
   - Main content = `{children}` (each page)
   - AI Panel toggles via state (Zustand store)

5. Move current dashboard page.tsx content into the new layout structure. Chat functionality moves into AIPanel. The main `(dashboard)/page.tsx` becomes the Home dashboard (build in Phase 2).

**Test:** Navigate between pages. AI panel opens/closes. Existing chat still works inside the panel.

### Phase 2: Home Dashboard

**Goal:** KPI cards, ROAS chart, campaign activity feed — matching Screenshot 2.

1. Create `src/hooks/useKPIs.ts`
   - Query performance_daily aggregated by organization + date range
   - Calculate: total clicks, total views, avg ROAS, total spend, total revenue
   - Calculate change % vs previous period
   - For now, use seed data (see below)

2. Create KPI components:
   - `KPICard.tsx`: icon, label (13px muted), big number (24px), change badge (+16% green / -5% red)
   - `KPIRow.tsx`: 5 cards in a flex row. Clickable — selected card has dark border + light green bg for ROAS
   - Selected KPI controls which metric the chart shows

3. Create `ROASChart.tsx`:
   - Recharts LineChart, two lines: current (solid green #2E7D32) and previous (dashed gray #C8C8C8)
   - Tooltip on hover: date, this period value, previous period value, change %
   - X-axis: months. Y-axis: multipliers (0x–20x)
   - Responsive height ~300px

4. Create `CampaignActivity.tsx`:
   - List of recent activity_log entries
   - Each row: platform icon (Meta=blue circle with M, Google=colored G), campaign name (bold), action description, timestamp
   - Status badges: "In review" (orange bg), "Ready" (green bg), "Budget optimized", "Campaign published"

5. Create `ChannelFilter.tsx`:
   - Date range dropdown: "Past 6 months", "Past month", "Past year"
   - Channel toggle: All channels, Meta only, Google only
   - "Analytics" button → links to /analytics

6. Wire it all up in `src/app/(dashboard)/page.tsx`

**Test:** Dashboard loads with seed data. KPI selection changes chart. Activity feed scrolls.

### Phase 3: Creatives Page

**Goal:** Creative grid with filters and view toggles — matching Screenshot 1.

1. Create `src/hooks/useCreatives.ts`
   - Query creatives joined with aggregated performance_daily
   - Filter by date range, sort by ROAS/spend/CTR, filter by spend range
   - Pagination (12 per page)

2. Create `CreativeCard.tsx`:
   - Square image (aspect-ratio: 1, object-fit: cover, rounded-lg)
   - Below image: name (14px semibold), then 3 metric rows:
     - ROAS {value}x (right-aligned)
     - Spend ${value} (right-aligned)
     - CTR {value}% (right-aligned)
   - Hover: subtle shadow lift
   - Click: open detail or select for AI analysis

3. Create `CreativeGrid.tsx`:
   - CSS grid: 3 columns on desktop, 2 on tablet, 1 on mobile
   - gap: 20px
   - Lazy loading images

4. Create `CreativeFilters.tsx`:
   - Date range dropdown
   - Sort dropdown: "ROAS (High → Low)", "Spend (High → Low)", "CTR (High → Low)"
   - Spend range filter
   - Filters stored in URL search params

5. Create `ViewToggle.tsx`:
   - 3 icons: list view, grid view, detailed grid view
   - Persist choice in localStorage

6. Wire up in `src/app/(dashboard)/creatives/page.tsx`

**Test:** Grid renders with seed data. Filters and sort work. View toggles switch layout.

### Phase 4: AI Panel Enhancement

**Goal:** Context-aware AI that knows which page the user is on.

1. Extend `system-prompt.ts`:
   - Accept a `pageContext` parameter: { page: 'home' | 'creatives' | 'campaigns', filters: {}, visibleData: {} }
   - When on Creatives page: inject all visible creatives with their metrics into the system prompt
   - When on Home: inject KPI summary and recent activity
   - When on Campaigns: inject campaign list with status and budgets

2. Add model selector to AI panel header:
   - Dropdown showing available models based on user's plan
   - Each option shows model name + credit cost
   - Selected model passed to /api/chat/route.ts
   - Route.ts checks plan.allowed_chat_models before calling API

3. Add "Show reasoning" toggle on AI messages:
   - AI responses include a `reasoning` field (use extended thinking or structured output)
   - Collapsed by default, expandable with "Show reasoning >" link
   - Reasoning text in smaller, muted style

4. Add suggested prompts:
   - Context-specific chips at bottom of AI panel
   - Creatives page: "Which creatives should I scale?", "Compare top performers", "Generate new variants"
   - Home: "What should I focus on today?", "Summarize this week", "Any underperforming campaigns?"

**Test:** AI panel shows relevant data based on current page. Model selector works. Reasoning toggle works.

### Phase 5: Multi-Model Image Generation

**Goal:** Generate ad images via multiple AI models.

1. Create `src/lib/providers/fal.ts`:
   - Install: `pnpm add @fal-ai/serverless-client`
   - Wrapper for FLUX Schnell, FLUX Pro, Seedream 4.5, Nano Banana Pro
   - All via fal.ai unified API
   - Map model IDs to fal endpoints

2. Create `src/lib/providers/openai-image.ts`:
   - Install: `pnpm add openai` (if not already)
   - Wrapper for GPT Image 1.5
   - Support size selection and quality setting

3. Create `src/lib/providers/model-router.ts`:
   - Takes: { model, prompt, size, userId, organizationId }
   - Checks user's plan for allowed_image_models
   - Checks credit balance
   - Routes to correct provider
   - Deducts credits on success
   - Saves generated image to Supabase Storage
   - Returns: { url, credits_used, credits_remaining }

4. Create `src/app/api/ai/generate-image/route.ts`:
   - POST handler using model-router
   - Streaming progress updates
   - Error handling for rate limits, insufficient credits, model unavailable

5. Create Creative Studio page `src/app/(dashboard)/creatives/studio/page.tsx`:
   - Large prompt textarea with template suggestions
   - Model selector showing available models with credit costs
   - Style presets: "Product photo", "Lifestyle", "Flat lay", "Studio", "Outdoor"
   - Size selector: 1:1, 4:5, 16:9, 9:16
   - Reference image upload (for Nano Banana Pro — supports up to 14 refs)
   - Generate button with credit cost shown
   - Results grid: 4 variants
   - Each result: "Use as creative", "Edit further", "Generate similar"
   - Credit balance bar at bottom

6. Add image generation to AI chat:
   - New tool in definitions.ts: `generate_ad_image`
   - AI can generate images inline during conversation
   - Images render in chat with action buttons

**Env vars needed:**
```
FAL_KEY=your_fal_ai_key
OPENAI_API_KEY=your_openai_key  # may already exist
```

**Test:** Generate an image with each model. Credits deducted correctly. Images saved to Supabase Storage.

### Phase 6: Credits System

**Goal:** Working credits with Stripe billing.

1. Create credit utility functions in `src/lib/credits/`:
   - `check.ts`: getBalance(orgId) → number
   - `deduct.ts`: deductCredits(orgId, amount, metadata) → { success, balance_after }
   - `refill.ts`: refillCredits(orgId, planCredits) → void

2. Create `src/hooks/useCredits.ts`:
   - Real-time balance via Supabase subscription on credit_ledger
   - Expose: balance, isLoading, refetch

3. Create credit UI components:
   - `CreditBalance.tsx`: shows in sidebar footer or topbar. Bar visualization + number.
   - `ModelSelector.tsx`: dropdown of available models with cost per action. Grayed out models = "Upgrade to Growth"
   - `CreditGate.tsx`: wrapper that checks credits before allowing an action. Shows "Insufficient credits" with upgrade CTA.
   - `UpgradePrompt.tsx`: modal showing plan comparison when user hits a limit.

4. Create API routes:
   - `src/app/api/credits/balance/route.ts`
   - `src/app/api/credits/deduct/route.ts`

5. Integrate Stripe for plan subscriptions:
   - Extend existing Stripe webhook to handle subscription events
   - On subscription created/updated: set organization.plan_id
   - Monthly credit refill: Vercel Cron at `0 0 1 * *` that resets credits to plan amount

6. Wire credits into every action:
   - AI chat: check + deduct per message based on model
   - Image generation: check + deduct based on model
   - Campaign launch: check + deduct 10 credits

**Test:** Credits deducted on AI chat. Credits deducted on image gen. Balance updates in real-time. Insufficient credits blocked gracefully.

### Phase 7: Remaining Pages

Build these pages once the core is solid:

- **Analytics**: detailed charts, breakdowns per platform/creative/audience, export
- **Performance**: per-campaign deep-dive, funnel viz
- **Campaigns**: table view with status, budget, ROAS, actions (existing logic adapted)
- **Audiences**: list with size estimates, linked campaigns
- **Products**: product catalog grid
- **Integrations**: Meta/Google connect flows, status, last sync
- **Wallet**: credit balance, transaction history, add credits
- **Settings**: org settings, team, billing, notifications

---

## SEED DATA

Run this after the schema migration to have data for UI development:

```sql
-- Seed organization
INSERT INTO public.organizations (id, name, slug, plan_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Bhoul Oslo', 'bhoul-oslo', 'growth');

-- Link your user to the org (replace YOUR_USER_ID)
-- UPDATE public.users SET organization_id = '00000000-0000-0000-0000-000000000001', full_name = 'Sarah Collins' WHERE id = 'YOUR_USER_ID';

-- Seed creatives
INSERT INTO public.creatives (id, organization_id, name, type, status) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Weekend Gold', 'image', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Weekend Ritual', 'image', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Weekend Still Life', 'image', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Seasonal Indulgence', 'image', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Curated Essentials', 'image', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Curated Selection', 'image', 'active');

-- Seed performance data (last 30 days for each creative)
-- Generate with a helper function or insert manually:
INSERT INTO public.performance_daily (organization_id, creative_id, platform, date, impressions, clicks, spend, revenue, ctr, roas)
SELECT
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'meta',
  d.date,
  (random() * 5000 + 500)::int,
  (random() * 200 + 20)::int,
  round((random() * 100 + 10)::numeric, 2),
  round((random() * 400 + 30)::numeric, 2),
  round((random() * 3 + 0.5)::numeric, 4),
  round((random() * 4 + 1)::numeric, 2)
FROM public.creatives c
CROSS JOIN generate_series(CURRENT_DATE - 30, CURRENT_DATE, '1 day'::interval) AS d(date)
WHERE c.organization_id = '00000000-0000-0000-0000-000000000001';

-- Seed activity log
INSERT INTO public.activity_log (organization_id, action, description, platform, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'budget_optimized', 'Holiday Sale 2025 — Budget optimized', 'meta', now()),
  ('00000000-0000-0000-0000-000000000001', 'campaign_published', 'Holiday Sale 2025 — Campaign published', 'meta', now() - interval '18 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'budget_optimized', 'Black Friday — Budget optimized', 'google', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000001', 'campaign_ready', 'Holiday Sale 2025 — Campaign ready for review', 'meta', now() - interval '4 hours');

-- Seed initial credits
INSERT INTO public.credit_ledger (organization_id, amount, balance_after, type, metadata) VALUES
  ('00000000-0000-0000-0000-000000000001', 2500, 2500, 'monthly_refill', '{"plan_id": "growth", "month": "2026-03"}');
```

---

## IMAGE GENERATION MODELS

| Model ID | Provider | API | Cost/img | Tier |
|----------|----------|-----|----------|------|
| `flux_schnell` | Black Forest Labs | fal.ai `fal-ai/flux/schnell` | ~$0.015 | Starter+ |
| `flux_pro` | Black Forest Labs | fal.ai `fal-ai/flux-2-pro` | ~$0.055 | Growth+ |
| `seedream_4_5` | ByteDance | fal.ai `fal-ai/seedream-v4.5` | ~$0.035 | Growth+ |
| `gpt_image_1_5` | OpenAI | OpenAI API `gpt-image-1.5` | ~$0.04 | Growth+ |
| `nano_banana_pro` | Google | fal.ai `fal-ai/nano-banana-pro` | ~$0.15 | Scale |

---

## RULES

- Do NOT delete or rename existing files without asking first.
- Do NOT modify existing database tables beyond the ALTER TABLE statements above.
- Do NOT change the existing chat/tool system — extend it.
- Keep all existing functionality working after each phase.
- Use existing patterns: Supabase client from lib/supabase, existing auth middleware, existing Zustand stores.
- Test after each phase before moving on.
- One component at a time. Don't build the entire phase in one go.
- Use Tailwind utility classes with the design tokens above.
- Use shadcn/ui components where they fit (Button, Card, Badge, Dialog, Sheet, Select, DropdownMenu).
- Use lucide-react for all icons.
- Use Recharts for all charts (already installed).
- Use Framer Motion for animations (already installed).

## START

Begin with Phase 1. Read the existing codebase first to understand current patterns, then build the sidebar layout.
