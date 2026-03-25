# AUDIT.md — Doost AI Ultimate System Audit

> Run this as a Claude Code prompt AFTER the system is built.
> It audits everything, reports findings, and fixes what it can.
>
> Usage: paste the entire prompt block below into Claude Code.
> It will run for 10-20 minutes depending on system size.
> Output: AUDIT-REPORT.md in the project root with all findings.

---

```
Read CLAUDE.md, PIPELINE.md, and LIVING-PROFILE.md for full context.

You are performing a comprehensive system audit of Doost AI.
Check EVERYTHING listed below. For each check:
- If it passes: log ✅ with details
- If it fails: log ❌ with exact problem and fix
- If it's a warning: log ⚠️ with recommendation
- If you CAN fix it automatically: fix it and log 🔧 with what you changed

Create a file called AUDIT-REPORT.md in the project root with all findings.
At the end, show a summary scorecard.

---

## AUDIT 1: Repository structure

Check that the monorepo matches CLAUDE.md exactly:

1.1 Verify these directories exist:
- apps/web/
- apps/web/app/(auth)/
- apps/web/app/(dashboard)/chat/
- apps/web/app/(dashboard)/campaigns/
- apps/web/app/(dashboard)/analytics/
- apps/web/app/(dashboard)/settings/
- apps/web/app/(marketing)/
- apps/web/app/api/chat/
- apps/web/app/api/brand/
- apps/web/app/api/campaigns/
- apps/web/app/api/platforms/meta/callback/
- apps/web/app/api/platforms/google/callback/
- apps/web/app/api/platforms/linkedin/callback/
- apps/web/app/api/webhooks/stripe/
- apps/web/app/api/inngest/
- apps/web/components/chat/
- apps/web/components/ads/
- apps/web/components/brand/
- apps/web/components/profile/
- apps/web/components/campaign/
- apps/web/components/ui/
- packages/db/schema/
- packages/db/migrations/
- packages/ai/agents/
- packages/ai/prompts/
- packages/ai/tools/
- packages/platforms/meta/
- packages/platforms/google/
- packages/platforms/linkedin/
- packages/brand/
- packages/templates/
- packages/intelligence/
- packages/triggers/
- packages/config/

For each missing directory: create it with a placeholder index.ts that exports nothing.
Log which ones were missing.

1.2 Check turbo.json has pipelines for: build, dev, lint, typecheck, test
If missing: add them. 🔧

1.3 Check package.json has scripts: dev, build, lint, typecheck, test, db:generate, db:push, db:studio
If missing: add them. 🔧

1.4 Check .gitignore includes: node_modules, .env.local, .env, .next, dist, .turbo, .vercel, .DS_Store
If missing entries: add them. 🔧

1.5 Check TypeScript strict mode is enabled in all tsconfig.json files.
If not strict: enable it. 🔧

1.6 Check path aliases work: @doost/db, @doost/ai, @doost/platforms, @doost/brand, @doost/templates, @doost/intelligence, @doost/triggers
If broken: fix the tsconfig paths. 🔧

---

## AUDIT 2: Environment variables

2.1 Check .env.example exists and contains ALL of these variable names:
```
NEXT_PUBLIC_APP_URL
NODE_ENV
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
FIRECRAWL_API_KEY
ROARING_API_KEY
META_APP_ID
META_APP_SECRET
META_BUSINESS_MANAGER_ID
META_SYSTEM_USER_TOKEN
META_AD_LIBRARY_ACCESS_TOKEN
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_MCC_ID
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_PLACES_API_KEY
GOOGLE_PAGESPEED_API_KEY
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
LANGFUSE_SECRET_KEY
LANGFUSE_PUBLIC_KEY
LANGFUSE_HOST
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

For each missing variable: add it to .env.example with a descriptive comment. 🔧

2.2 If .env.local exists, check it has no empty values for critical keys:
- DATABASE_URL, ANTHROPIC_API_KEY, CLERK_SECRET_KEY
- Don't log the actual values (security), just whether they're set

2.3 Check that DATABASE_URL uses the pooler endpoint (port 6543, contains pgbouncer=true).
If using direct connection (port 5432): warn ⚠️ that this will break under concurrent load.

2.4 Check that DIRECT_URL exists and uses port 5432 (for migrations).
If missing: warn ⚠️

---

## AUDIT 3: Database schema

3.1 Read reference/schema.ts (or packages/db/schema/index.ts) and verify ALL 15 tables exist:
- organizations
- brand_profiles
- ad_accounts
- campaigns
- ad_creatives
- conversations
- creative_performance
- ad_templates
- social_presence
- google_reviews
- competitor_tracking
- competitor_ads
- behavior_signals
- profile_triggers
- website_audits

For each missing table: create it following the schema specification. 🔧

3.2 Verify brand_profiles table has ALL these fields (from LIVING-PROFILE.md):
- id, org_id, url, name, description
- industry, industry_codes, employee_count, revenue, location, ceo, org_number
- colors (jsonb), fonts (jsonb), logos (jsonb)
- brand_voice, target_audience, value_propositions, competitors
- tone_formality, tone_warmth, tone_urgency, tone_description
- enrichment_status (text: complete/partial/pending)
- performance_profile (jsonb)
- behavior_profile (jsonb)
- profile_completeness (integer 0-100)
- social_presence_score (integer 0-100)
- marketing_readiness_score (integer 0-100)
- raw_scrape_data (jsonb), raw_enrichment_data (jsonb)
- created_at, updated_at

For each missing field: add it with appropriate type and default. 🔧

3.3 Check that every tenant-scoped table has:
- org_id field with FK reference to organizations
- Index on org_id
- RLS policy (if Supabase migrations exist)

If missing: add the field/index. Log tables without RLS policies. 🔧

3.4 Check foreign key relationships are correct:
- brand_profiles.org_id → organizations.id (cascade delete)
- campaigns.brand_profile_id → brand_profiles.id
- ad_creatives.campaign_id → campaigns.id (cascade delete)
- social_presence.brand_profile_id → brand_profiles.id
- google_reviews.brand_profile_id → brand_profiles.id
- competitor_tracking.brand_profile_id → brand_profiles.id
- competitor_ads.competitor_id → competitor_tracking.id
- behavior_signals.org_id → organizations.id
- profile_triggers.org_id → organizations.id
- website_audits.brand_profile_id → brand_profiles.id

For each missing/wrong FK: fix it. 🔧

3.5 Check Drizzle relations are defined for all tables.
If missing: add them. 🔧

3.6 Check for missing indexes on commonly queried columns:
- campaigns: status, brand_profile_id
- ad_creatives: campaign_id, platform
- creative_performance: creative_id, (org_id + date), (platform + date)
- social_presence: (brand_profile_id + platform)
- competitor_ads: competitor_id
- behavior_signals: (org_id + signal_type)
- profile_triggers: (org_id + trigger_id)

For each missing index: add it. 🔧

---

## AUDIT 4: Authentication & authorization

4.1 Check Clerk middleware exists at middleware.ts:
- Protects all /(dashboard)/* routes
- Allows public access to /(marketing)/* and /api/webhooks/*
- Redirects unauthenticated users to /sign-in

If missing or misconfigured: fix it. 🔧

4.2 Check ClerkProvider wraps the root layout.
If missing: add it. 🔧

4.3 Check that auth() is called in all API routes under /api/ (except webhooks).
List any unprotected API routes.

4.4 Check that ad platform OAuth tokens are encrypted before storage.
Look for: AES-256-GCM, encryption key management, IV storage.
If tokens stored in plaintext: log ❌ critical security issue.

4.5 Check rate limiting exists on public endpoints:
- /api/chat (should be rate limited per user)
- /api/brand/analyze (should be rate limited per IP for anonymous)
If no rate limiting found: log ⚠️ and recommend Upstash rate limiting.

---

## AUDIT 5: Chat system

5.1 Check chat API route exists at app/api/chat/route.ts:
- Uses streamText() from Vercel AI SDK
- Has system prompt that references LIVING-PROFILE.md behavior
- Has model routing (Haiku for chat, Sonnet for copy, GPT-4o for variants)
If using single model for everything: log ⚠️ recommend smart routing.

5.2 Check these chat tools are registered:
- analyze_brand: triggers brand analysis pipeline
- generate_ads: generates ad copy + creatives
- deploy_campaign: deploys to platforms
- get_performance: fetches campaign metrics
- check_platform_status: shows connected platforms
- ask_profile_question: renders interactive question cards

For each missing tool: log ❌ and describe what it should do.

5.3 Check that AI context injection exists:
- Does the system prompt include customer preferences from behavior_signals?
- Does it include winning/losing patterns from performance_profile?
- Does it include pending recommendations from profile_triggers?
- Does it include competitor activity?

If missing: log ❌ and provide the buildAIContext() function from LIVING-PROFILE.md.

5.4 Check conversation context windowing:
- Is there a mechanism to handle long conversations (>20 messages)?
- Does it summarize older messages with Haiku?
- Does it pin important tool results (brand profile, deployments)?

If missing: log ⚠️ — conversations will break after ~30 messages.

5.5 Check chat UI components exist:
- ChatMessages (message list)
- ChatInput (prompt box with glass design)
- TypingIndicator (animated dots)
- SuggestionChips (contextual action chips)
- BrandProfileCard (tool UI for analyze_brand)
- AdPreviewTabs (tool UI for generate_ads)
- CampaignDeploymentStatus (tool UI for deploy_campaign)

For each missing component: log ❌.

---

## AUDIT 6: Brand intelligence pipeline

6.1 Check Firecrawl integration exists in packages/brand/:
- scrapeBrand(url) function
- Extracts: colors, fonts, logos, content, services
- Has retry logic (retry once, then Apify fallback)
- Has timeout (10s max)
If missing or incomplete: log ❌.

6.2 Check Roaring.io integration exists in packages/brand/:
- enrichCompany(domain) function
- Extracts: name, org number, SNI codes, employees, revenue, CEO
- Has ROARING_MOCK flag for development
- Handles not-found gracefully (returns null, doesn't throw)
If missing: log ❌.

6.3 Check social detection exists in packages/intelligence/:
- detectSocialPresence(url, companyName) function
- Three methods: HTML scanning, platform search, common URL patterns
- Returns: platform, URL, followers, is_active for each found account
If missing: log ❌.

6.4 Check Google reviews integration exists in packages/intelligence/:
- getGooglePresence(companyName, city) function
- Uses Google Places API
- Extracts: rating, review count, recent reviews with sentiment
If missing: log ❌.

6.5 Check competitor tracking exists in packages/intelligence/:
- getCompetitorIntel(brandProfile, competitors) function
- Searches Meta Ad Library API for active ads
- Counts ads per competitor
- Identifies gap opportunities
If missing: log ❌.

6.6 Check website audit exists in packages/intelligence/:
- auditWebsite(url) function
- Calls PageSpeed Insights API
- Detects tracking pixels (Meta Pixel, Google Tag, LinkedIn Insight)
- Detects tech stack, blog, contact form, pricing page
- Calculates readiness score (0-100)
- Generates issues with severity and impact
If missing: log ❌.

6.7 Check that all 5 intelligence jobs run in PARALLEL:
Look for Promise.allSettled([scrapeBrand, enrichCompany, detectSocialPresence, getGooglePresence, auditWebsite])
If running sequentially: log ❌ — will take 20s instead of 5s. Fix to parallel. 🔧

6.8 Check profile builder merges all data sources:
- buildBrandProfile() accepts: scrapeData, enrichmentData, socialPresence, googleReviews, websiteAudit
- Uses Claude Haiku for synthesis
- Infers: brand voice, target audience, value propositions, competitors, suggested objective
- Validates output with Zod schema
If missing data sources in the merge: log ❌.

6.9 Check that profile renders in 4 progressive phases:
- Phase 1: IdentityCard component
- Phase 2: SocialPresence component
- Phase 3: CompetitorRadar component
- Phase 4: ReadinessScore component
If rendering all at once or missing phases: log ❌.

---

## AUDIT 7: Ad generation pipeline

7.1 Check copywriter agent exists in packages/ai/agents/:
- generateAdCopy(brandProfile, platform, objective) function
- Uses Claude Sonnet for hero copy
- Uses GPT-4o for A/B variants (2-3 variants)
- Platform-specific prompts with correct character limits:
  * Meta: headline ≤40, body ≤125, CTA ≤20
  * Google: 3x headlines ≤30, 2x descriptions ≤90
  * LinkedIn: intro ≤150, headline ≤70
- Validates output against limits, retries if exceeded
If missing or wrong limits: log ❌.

7.2 Check copy caching:
- Cache key: hash of brandProfileId + platform + objective
- Storage: Upstash Redis
- TTL: 1 hour
- Hero copy cached, variants NEVER cached
If no caching: log ⚠️ — wasting ~40% on duplicate LLM calls.

7.3 Check template system in packages/templates/:
- At least 6 templates (2 per platform)
- renderer.ts with renderTemplate() and renderToImage() functions
- Uses Satori (or Puppeteer) for HTML→PNG conversion
- Templates accept brand colors, logo, copy as variables
If fewer than 6 templates: log ⚠️.
If no rendering pipeline: log ❌.

7.4 Check creative director agent:
- assembleCreatives() function
- Selects templates (vector-based OR rule-based fallback)
- Renders final images
- Uploads to R2
- Returns complete AdCreative objects
If missing: log ❌.

7.5 Check pre-rendering background job:
- Inngest function triggered on brand.profile.created
- Pre-renders all templates with brand colors + placeholder copy
- Uploads to R2
- Stores URLs in brand_template_previews (or similar table)
If missing: log ⚠️ — ad previews will be slow (8s instead of instant).

7.6 Check Langfuse tracing on LLM calls:
- Every streamText/generateText call has a Langfuse trace
- Trace includes: model, tokens, latency, prompt version, cache hit
If missing: add tracing. 🔧

---

## AUDIT 8: Platform integrations

8.1 META — Check packages/platforms/meta/:
- client.ts: MetaAdsClient class with createCampaign, createAdSet, createAd, uploadImage, getInsights
- auth.ts: OAuth flow, token exchange, system user token handling
- campaigns.ts: deployCampaign, pauseCampaign, getCampaignInsights
- Rate limiting: tracks X-Business-Use-Case header
- Error handling: maps Meta error codes to human messages
If any file missing: log ❌.

8.2 GOOGLE — Check packages/platforms/google/:
- client.ts: GoogleAdsClient with developer token + MCC
- auth.ts: OAuth flow, refresh tokens
- campaigns.ts: createClientAccount (under MCC), deploySearchCampaign, getCampaignMetrics
If any file missing: log ❌.

8.3 LINKEDIN — Check packages/platforms/linkedin/:
- client.ts: LinkedInAdsClient (REST API)
- auth.ts: 3-legged OAuth, 60-day token refresh
- campaigns.ts: deploySponsoredContent, getCampaignAnalytics
If any file missing: log ❌.

8.4 Check platform adapter pattern:
- AdPlatformAdapter interface in packages/platforms/types.ts
- All three platform clients implement the same interface
- getPlatformAdapter(platform) factory function
If no adapter pattern: log ⚠️ — adding new platforms will require refactoring everything.

8.5 Check OAuth callback routes:
- /api/platforms/meta/callback
- /api/platforms/google/callback
- /api/platforms/linkedin/callback
Each should: exchange code for token, encrypt token, store in ad_accounts, redirect back
If missing: log ❌.

8.6 Check token refresh background jobs:
- Inngest cron for Meta token refresh (daily, refresh 7 days before expiry)
- Inngest cron for LinkedIn token refresh (daily, refresh 14 days before expiry)
- Google handles refresh automatically via SDK
- On refresh failure: mark account disconnected, pause campaigns, notify user
If missing: log ❌ — tokens WILL expire and campaigns will stop without warning.

8.7 Check idempotent deployment:
- deployments table exists
- Idempotency key: hash of campaignId + platform + date
- Check before creating platform objects
- Prevents duplicate campaigns on retry
If missing: log ❌ critical — retries WILL create duplicate campaigns and double ad spend.

8.8 Check parallel deployment:
- Inngest fan-out pattern for deploying to multiple platforms
- Each platform deploys independently
- Partial failure handling (Meta succeeds, Google fails → "partially_live")
If sequential deployment: log ⚠️ — 15s instead of 5s.

---

## AUDIT 9: Behavior tracking & triggers

9.1 Check behavior tracker in packages/intelligence/:
- trackChatBehavior() function
- Tracks: edit patterns, approval speed, platform preference, tone adjustments
- Saves to behavior_signals table
- Runs in background (doesn't slow down chat)
If missing: log ⚠️ — Layer 2 of LIVING-PROFILE won't work.

9.2 Check AI context injection uses behavior data:
- buildAIContext() function exists
- Includes: preferences, winning patterns, what to avoid, competitor activity
- Injected into system prompt on every chat message
If missing: log ❌ — AI won't feel like it knows the customer.

9.3 Check trigger system in packages/triggers/:
- definitions.ts: all 7 triggers defined (competitor, performance, seasonal, fatigue, reviews, scale, budget)
- engine.ts: evaluateTriggers() function with cooldown checking
- notifications.ts: notifyUser() that sends in-chat + email notifications
- Inngest cron: runs every 6 hours after performance polling
If missing: log ❌ — the proactive system is a key differentiator.

9.4 Check trigger cooldowns:
- profile_triggers table records when each trigger last fired per org
- Engine respects cooldown (doesn't spam users)
If no cooldown logic: log ⚠️ — users will get annoyed.

---

## AUDIT 10: Performance & optimization

10.1 Check edge caching:
- Brand profiles cached at edge (stale-while-revalidate, 24h TTL)
- Cache invalidation on profile update
If no caching: log ⚠️ — every chat message hits the database.

10.2 Check database connection pooling:
- DATABASE_URL uses Supabase pooler (port 6543)
- prepare: false in Postgres client config
If not pooled: log ❌ — will crash at 100+ concurrent users.

10.3 Check lazy loading:
- Ad preview components loaded with React.lazy
- Suspense fallback with skeleton
If all loaded eagerly: log ⚠️ — unnecessary bundle size.

10.4 Check model routing:
- Short chat messages → Haiku (cheapest)
- Hero copy → Sonnet (best quality)
- Variants/regeneration → GPT-4o (fast)
- Profile assembly → Haiku (structured)
- Optimization analysis → Haiku (data-focused)
If single model for everything: log ⚠️ — wasting ~40% on LLM costs.

10.5 Check R2 storage:
- Ad creatives uploaded to Cloudflare R2
- Logos stored in R2 (not referenced from external URLs)
- Public URL configured for CDN access
If using local storage or external URLs: log ⚠️.

10.6 Check Inngest is set up:
- /api/inngest route handler exists
- All background functions registered
- List all registered Inngest functions and their schedules

Expected functions:
| Function | Trigger |
|----------|---------|
| brand/analyze | Event: brand.analyze |
| brand/retry-enrichment | Event: brand.enrichment.failed |
| creatives/pre-render | Event: brand.profile.created |
| campaign/deploy | Event: campaign.deploy |
| meta/refresh-tokens | Cron: daily |
| linkedin/refresh-tokens | Cron: daily |
| analytics/poll-metrics | Cron: every 6 hours |
| optimizer/analyze | Event: analytics.poll.complete |
| triggers/evaluate-all | Cron: every 6 hours (30min after poll) |
| analytics/weekly-digest | Cron: Monday 9am |
| embeddings/update | Cron: nightly 2am |
| profile/weekly-refresh | Cron: Monday midnight |
| deployments/cleanup | Cron: weekly |
| intelligence/refresh-competitors | Cron: Monday |

For each missing function: log ❌.

---

## AUDIT 11: Registration & billing

11.1 Check progressive registration (3 levels):
- Level 0 (anonymous): guest session stored in Redis, 7-day TTL
- Level 1 (email): Clerk sign-up, saves profile
- Level 2 (card): Stripe SetupIntent, 14-day free trial
If using single registration gate: log ⚠️ — conversion will be lower.

11.2 Check guest session management:
- Redis key: guest:{sessionId}
- Stores: brandProfile, adCreatives, chatHistory, targeting answers
- 7-day TTL
- Migration function: migrateGuestToUser(sessionId, orgId)
If no guest sessions: log ⚠️ — anonymous users lose everything on page refresh.

11.3 Check Stripe integration:
- Products/prices for Free, Starter (€199), Pro (€499), Agency (€999)
- Webhook handler for: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed
- SetupIntent for saving card without charging
- 14-day trial on first subscription
If missing: log ❌.

11.4 Check plan enforcement:
- Middleware checks plan limits before campaign creation
- Free: 1 campaign, 1 channel
- Starter: 5 campaigns, 2 channels
- Pro: unlimited, 3 channels
- Agency: unlimited, multi-org
If no plan checks: log ⚠️ — free users can run unlimited campaigns.

11.5 Check weekly ad spend billing:
- Inngest cron that sums actual ad spend per org
- Adds 10% service fee
- Creates Stripe invoice
- Auto-charges saved card
If missing: log ❌ — we're paying for their ad spend without billing them.

---

## AUDIT 12: Observability & monitoring

12.1 Check Sentry setup:
- @sentry/nextjs installed
- sentry.client.config.ts exists
- sentry.server.config.ts exists
- Error boundaries in layout.tsx
If not set up: log ⚠️.

12.2 Check Langfuse setup:
- Langfuse client initialized
- Every LLM call traced with: model, tokens, latency, prompt version
- Cost tracking per org
If not set up: log ⚠️ — no visibility into AI costs or quality.

12.3 Check PostHog setup:
- PostHog provider in layout
- Key events tracked: sign_up, brand_analyzed, ads_generated, campaign_deployed, plan_upgraded
- Feature flags configured
If not set up: log ⚠️.

12.4 Check health endpoint:
- /api/health exists
- Checks: database connection, Redis connection, Clerk auth
- Returns: { status: 'ok', checks: { db: 'ok', redis: 'ok', auth: 'ok' } }
If missing: create it. 🔧

---

## AUDIT 13: Security

13.1 Check CORS configuration:
- API routes restricted to doost.ai domains
If wide open: log ❌.

13.2 Check webhook signature verification:
- Stripe webhooks verify signature
- Meta webhooks verify app secret
- Inngest webhooks verify signing key
If any unverified: log ❌.

13.3 Check for exposed secrets:
- Search entire codebase for hardcoded API keys, tokens, passwords
- Check: no .env.local committed to git
- Check: no secrets in client-side code (NEXT_PUBLIC_ should only have safe keys)
If found: log ❌ critical.

13.4 Check token encryption:
- Ad platform tokens encrypted with AES-256-GCM (minimum)
- IV stored alongside ciphertext
- Encryption key not hardcoded
If plaintext: log ❌ critical.

13.5 Check input validation:
- All API routes validate input with Zod
- URL input sanitized before passing to Firecrawl
- No raw SQL queries (Drizzle ORM only)
If missing validation: log ⚠️.

---

## AUDIT 14: Code quality

14.1 Run TypeScript type check:
```
pnpm typecheck
```
Log number of errors. If >0: list them.

14.2 Run linter:
```
pnpm lint
```
Log number of warnings and errors.

14.3 Check for `any` types:
Search codebase for `: any` and `as any`.
Each instance is a type safety hole. Log count and locations.

14.4 Check for console.log statements:
Should use structured logging (Axiom/Sentry), not console.log.
Log count. If >10: recommend cleanup.

14.5 Check error handling patterns:
- API routes return consistent { success, data?, error? }
- No swallowed errors (catch blocks that do nothing)
- Inngest functions use built-in retry
Search for empty catch blocks. Log count.

14.6 Check for TODO/FIXME/HACK comments:
List them all with file:line. These are tech debt markers.

---

## AUDIT 15: LIVING-PROFILE compliance

This is the most important audit. Check that the actual implementation matches LIVING-PROFILE.md.

15.1 Layer 1 (Static identity) — does the profile store:
- Colors (5: primary, secondary, accent, background, text) ✅/❌
- Fonts (heading + body) ✅/❌
- Logos (primary, favicon, SVG, dark variant) ✅/❌
- Tone scores (formality, warmth, urgency 1-10) ✅/❌
- Social presence per platform ✅/❌
- Google reviews + sentiment ✅/❌
- Competitor list with active ads ✅/❌
- Website audit with readiness score ✅/❌

15.2 Layer 2 (Learned behavior) — does the system:
- Track edit patterns from chat ✅/❌
- Track approval speed ✅/❌
- Track platform preference ✅/❌
- Infer tone preferences ✅/❌
- Store behavior signals with confidence scores ✅/❌
- Use behavior data in AI context ✅/❌

15.3 Layer 3 (Performance intelligence) — does the system:
- Calculate winning patterns from top-performing ads ✅/❌
- Calculate losing patterns to avoid ✅/❌
- Track Creative DNA (best colors, headlines, CTAs per customer) ✅/❌
- Calculate optimal budget allocation ✅/❌
- Detect seasonal patterns ✅/❌
- Calculate industry position (percentile) ✅/❌

15.4 Proactive triggers — are all 7 triggers implemented:
- competitor_new_campaign ✅/❌
- performance_drop ✅/❌
- seasonal_opportunity ✅/❌
- ad_fatigue ✅/❌
- new_google_reviews ✅/❌
- ready_to_scale ✅/❌
- budget_waste ✅/❌

15.5 Network effect — does the system:
- Aggregate patterns across same-industry customers ✅/❌
- Use cross-customer data for template recommendations ✅/❌
- Calculate industry benchmarks from real Doost data ✅/❌
- Feed embeddings into pgvector for similarity search ✅/❌

15.6 AI as colleague — in a real chat session:
- Can the AI reference the customer's winning patterns? ✅/❌
- Does it know their preferred tone? ✅/❌
- Does it mention competitor activity proactively? ✅/❌
- Does it adapt to their control level (hands-off vs hands-on)? ✅/❌

---

## OUTPUT FORMAT

Create AUDIT-REPORT.md with this structure:

```markdown
# Doost AI — System Audit Report
Generated: [date]

## Scorecard

| Category | Score | Issues |
|----------|-------|--------|
| Repository structure | X/10 | N critical, N warnings |
| Environment | X/10 | ... |
| Database schema | X/10 | ... |
| Auth & security | X/10 | ... |
| Chat system | X/10 | ... |
| Brand intelligence | X/10 | ... |
| Ad generation | X/10 | ... |
| Platform integrations | X/10 | ... |
| Behavior & triggers | X/10 | ... |
| Performance | X/10 | ... |
| Registration & billing | X/10 | ... |
| Observability | X/10 | ... |
| Security | X/10 | ... |
| Code quality | X/10 | ... |
| LIVING-PROFILE compliance | X/10 | ... |

**Overall: X/150**

## Auto-fixed issues (🔧)
[List everything you fixed automatically]

## Critical issues (❌)
[List with exact fix instructions]

## Warnings (⚠️)
[List with recommendations]

## Passing checks (✅)
[List for reference]
```

Scoring:
- 10/10: everything passes
- 8-9: minor warnings only
- 5-7: some missing features
- 3-4: major missing pieces
- 0-2: not implemented

Be thorough. Be specific. Every check must have a clear ✅, ❌, ⚠️, or 🔧.
At the end, print the overall score and top 5 priorities to fix.
```
