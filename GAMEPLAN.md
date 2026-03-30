# DOOST AI — GAMEPLAN TO PRODUCTION

## Current Status: 85% product-ready, 0% production-ready

The core flow works: URL → Brand Analysis → Goal → Ad Creation → Preview → Publish
What's missing: Auth, real deployment, security, dashboards, observability

---

## PHASE 1: CLEAN THE HOUSE (Day 1-2)
**Goal: Remove dead code, fix consistency, clean up artifacts**

### 1.1 Remove Dead Code
- [ ] Delete `show_onboarding` tool from route.ts (deprecated, causes ghost calls)
- [ ] Delete `apps/web/components/chat/onboarding-cards.tsx` (never rendered)
- [ ] Delete `apps/web/components/command-palette.tsx` (unused)
- [ ] Remove `rawScrapeData` and `rawEnrichmentData` from tool returns (debug data leaking to client)
- [ ] Remove `_analysisMs`, `_logoSource` from client-facing data (move to server logs)

### 1.2 Replace Console Logs
- [ ] Audit ALL console.log/warn in `apps/web/app/api/chat/route.ts` → replace with Langfuse traces
- [ ] Audit ALL console.log in `packages/intelligence/src/orchestrator.ts` → structured logging
- [ ] Audit ALL console.log in `packages/templates/src/ai-image-generator.ts` → structured logging
- [ ] Audit ALL console.log in `packages/ai/src/agents/copywriter.ts` → Langfuse cost tracking

### 1.3 Fix Consistency
- [ ] Standardize border opacity: pick ONE value (border-border/30) and use everywhere
- [ ] Standardize button padding: small=px-2.5 py-1, medium=px-3 py-1.5, large=px-4 py-2
- [ ] Standardize text sizes: labels=text-[9px], body=text-xs, titles=text-sm
- [ ] Remove duplicate/conflicting Tailwind classes in copy-preview-card.tsx

---

## PHASE 2: AUTHENTICATION & MULTI-TENANCY (Day 3-5)
**Goal: Every user has their own workspace, data is isolated**

### 2.1 Clerk Integration
- [ ] Enable `apps/web/middleware.ts` with Clerk auth
- [ ] Configure matcher: protect `/api/chat`, `/api/brand/*`, `/api/campaigns/*`, `/dashboard/*`
- [ ] Keep public: `/`, `/api/webhooks/*`, `/api/platforms/*/callback`
- [ ] Add `ClerkProvider` to `apps/web/app/layout.tsx`
- [ ] Extract `userId` and `orgId` from Clerk in `apps/web/app/api/chat/route.ts`

### 2.2 Org Context Through Flow
- [ ] Pass `orgId` to all tool execute functions
- [ ] Update `check_plan` to use real orgId (remove hardcoded "pro")
- [ ] Update `check_platform_status` to use real orgId
- [ ] Update `deploy_campaign` to use real orgId
- [ ] Store brand analysis results in DB with orgId

### 2.3 Database RLS
- [ ] Enable RLS on ALL tables: brand_profiles, campaigns, ad_creatives, conversations
- [ ] Enable RLS on intelligence tables: social_presence, google_reviews, website_audits
- [ ] Create `get_current_org_id()` function using JWT claims
- [ ] Test: user A cannot read user B's data
- [ ] Test: user A cannot write to user B's campaigns

### 2.4 Auth UI
- [ ] Add Clerk sign-in/sign-up pages at `/(auth)/sign-in` and `/(auth)/sign-up`
- [ ] Update "Logga in" button in header to use Clerk
- [ ] Show user avatar + org name in header when authenticated
- [ ] Add sign-out option

---

## PHASE 3: SECURITY HARDENING (Day 6-7)
**Goal: No vulnerabilities before going live**

### 3.1 Rate Limiting
- [ ] Install Upstash rate limiter: `@upstash/ratelimit`
- [ ] `/api/chat` POST: 20 requests/minute per IP (unauthenticated), 60/min per orgId (authenticated)
- [ ] `/api/brand/*`: 10 requests/minute per IP
- [ ] `/api/platforms/*/callback`: 5 requests/minute per IP
- [ ] Return 429 with "Retry-After" header

### 3.2 OAuth Security
- [ ] Sign LinkedIn OAuth state with HMAC-SHA256 using a server secret
- [ ] Verify HMAC signature on callback before processing
- [ ] Add CSRF token to OAuth flow
- [ ] Set state expiry (10 minutes max)

### 3.3 CORS & CSP
- [ ] Add CORS headers: allow only `https://doost.tech` in production
- [ ] Add Content-Security-Policy header via `next.config.ts`
- [ ] Block `frame-ancestors` to prevent clickjacking

### 3.4 Token Encryption
- [ ] Encrypt all ad platform tokens (Meta, Google, LinkedIn) with AES-256-GCM before DB storage
- [ ] Decrypt only when making API calls to platforms
- [ ] Store encryption key in environment variable, NOT in code

### 3.5 GDPR
- [ ] Create `DELETE /api/orgs/[id]/data` endpoint
- [ ] CASCADE delete: brand_profiles → campaigns → ad_creatives → conversations → analytics
- [ ] Require confirmation (7-day cooling period)
- [ ] Log deletion request to audit trail

---

## PHASE 4: REAL CAMPAIGN DEPLOYMENT (Day 8-12)
**Goal: Ads actually deploy to Meta and Google**

### 4.1 Meta Ads Integration
- [ ] Implement `packages/platforms/meta/client.ts` — Meta Marketing API client
- [ ] Create campaign: objective → ad set → ad creative → ad
- [ ] Upload creative image (from DALL-E/template render)
- [ ] Set targeting: location, age, interests from brand data
- [ ] Set budget: daily budget from publish card
- [ ] Handle errors: rate limits, creative rejection, account suspension

### 4.2 Google Ads Integration
- [ ] Implement `packages/platforms/google/client.ts` — Google Ads API client
- [ ] Create responsive search ad: 15 headlines + 4 descriptions
- [ ] Set targeting: keywords (extracted from brand), locations
- [ ] Set budget from publish card
- [ ] Handle errors: policy violations, billing issues

### 4.3 Inngest Deployment Functions
- [ ] `campaign/deploy-meta` — creates Meta campaign via API
- [ ] `campaign/deploy-google` — creates Google campaign via API
- [ ] `campaign/deploy-linkedin` — creates LinkedIn campaign via OAuth
- [ ] `campaign/check-status` — polls platform APIs every 30min for first 24h
- [ ] `campaign/handle-rejection` — if creative rejected, notify user in chat
- [ ] All functions: exponential backoff, max 3 retries

### 4.4 Update deploy_campaign Tool
- [ ] Remove demo mode return
- [ ] Send real Inngest events for each platform
- [ ] Store campaign in DB with status: `pending` → `deploying` → `active` / `failed`
- [ ] Return real campaign IDs and platform-specific URLs
- [ ] Update CampaignDeploymentStatus component to show real data

### 4.5 Stripe Plan Enforcement
- [ ] Query Stripe API for customer's current subscription
- [ ] Map Stripe plan → campaign limits, channel limits
- [ ] Remove hardcoded `const plan = "pro"` in check_plan
- [ ] Show upgrade prompts when limits are hit
- [ ] Handle Stripe webhooks: subscription created/updated/cancelled

---

## PHASE 5: PERFORMANCE TRACKING (Day 13-15)
**Goal: Users see how their ads perform**

### 5.1 Metrics Infrastructure
- [ ] Create `campaign_metrics` table: campaign_id, platform, date, impressions, clicks, spend, conversions
- [ ] Inngest function: `analytics/poll-metrics` — every 6 hours per active campaign
- [ ] Meta Marketing API: get campaign insights (impressions, clicks, CTR, CPC, spend)
- [ ] Google Ads API: get campaign metrics
- [ ] Store in DB, indexed by campaign_id + date

### 5.2 Performance Notifications
- [ ] `analytics/performance-check` — daily Inngest function
- [ ] Detect: CTR drop >30% week-over-week
- [ ] Detect: budget exhausted before end of day
- [ ] Detect: creative fatigue (same ad running >21 days, declining CTR)
- [ ] Send notification to chat: "Your Meta campaign CTR dropped 35%. Should I create new copy?"

### 5.3 LIVING-PROFILE Integration
- [ ] Store performance patterns in `brand_profiles.performance_dna` (JSONB)
- [ ] Track: winning headline length, best CTAs, best time of day, best audience segments
- [ ] Feed into copywriter prompt: "Based on your data, short headlines with numbers perform 47% better"
- [ ] Update profile weekly via Inngest cron

---

## PHASE 6: DASHBOARDS (Day 16-19)
**Goal: Users can manage everything outside of chat**

### 6.1 Analytics Dashboard
- [ ] `apps/web/app/(dashboard)/analytics/page.tsx`
- [ ] Overview cards: total spend, total clicks, avg CTR, avg CPC, ROAS
- [ ] Chart: daily performance trend (impressions + clicks + spend)
- [ ] Platform breakdown: Meta vs Google vs LinkedIn
- [ ] Campaign comparison table
- [ ] Date range picker

### 6.2 Campaign Management
- [ ] `apps/web/app/(dashboard)/campaigns/page.tsx`
- [ ] Campaign list with status badges (active, paused, ended, failed)
- [ ] Quick actions: pause, resume, edit budget, duplicate
- [ ] Campaign detail: creative preview, targeting summary, performance metrics
- [ ] Creative rotation: swap ad copy/image without creating new campaign

### 6.3 Settings
- [ ] `apps/web/app/(dashboard)/settings/page.tsx`
- [ ] Organization settings: name, industry, location
- [ ] Billing: current plan, usage, upgrade button (Stripe Customer Portal)
- [ ] Connected accounts: Meta, Google, LinkedIn — status + disconnect
- [ ] Brand profile: view/edit analyzed brand data
- [ ] Team members: invite, roles (future)

---

## PHASE 7: OBSERVABILITY & MONITORING (Day 20-21)
**Goal: Know what's happening in production**

### 7.1 Sentry
- [ ] Fix DSN placeholder check in `next.config.ts`
- [ ] Add user context: `Sentry.setUser({ id: userId, email })`
- [ ] Add org context: `Sentry.setTag("orgId", orgId)`
- [ ] Set up error alerts: >5 errors/hour → Slack notification
- [ ] Group intelligence pipeline errors by layer (vision, social, logo, audit)

### 7.2 Langfuse
- [ ] Trace ALL LLM calls: brand analysis, strategy, copy generation
- [ ] Track cost per call: model, input_tokens, output_tokens, cost_usd
- [ ] Trace tool execution: duration, success/failure
- [ ] Create dashboard: daily cost, cost per customer, cost per campaign
- [ ] Set alerts: daily cost > budget threshold

### 7.3 PostHog
- [ ] Track funnel events:
  - `url_submitted` → `brand_analyzed` → `brand_approved` → `goal_selected` → `ad_generated` → `ad_published` → `campaign_live`
- [ ] Track feature usage: layout switches, color edits, variant picks, quickpick clicks
- [ ] Build conversion funnel dashboard
- [ ] Identify drop-off points
- [ ] A/B test UI changes

### 7.4 Uptime Monitoring
- [ ] Set up status page (Betteruptime or similar)
- [ ] Monitor: doost.tech, api/chat, api/brand, Supabase, Inngest
- [ ] Alert on downtime: email + Slack
- [ ] SLA target: 99.9% uptime

---

## PHASE 8: TRIGGERS & PROACTIVE AI (Day 22-24)
**Goal: Doost reaches out to users, not just responds**

### 8.1 Trigger Engine
- [ ] Implement `packages/triggers/engine.ts` per LIVING-PROFILE spec
- [ ] Define triggers in `packages/triggers/definitions.ts`:
  - `ad_fatigue`: creative running >21 days, CTR declining
  - `performance_drop`: CTR down >30% week-over-week
  - `budget_opportunity`: ROAS >3x, room to scale
  - `seasonal_peak`: industry-specific high-conversion periods
  - `competitor_move`: new competitor ads detected (Meta Ad Library)
  - `creative_refresh`: suggest new variants based on winning patterns

### 8.2 Notification Delivery
- [ ] In-chat notifications: render as special tool result
- [ ] Email notifications via Resend
- [ ] Notification preferences in settings
- [ ] Cooldown: max 3 notifications per org per week

### 8.3 Inngest Cron Jobs
- [ ] `triggers/evaluate` — every 6 hours, check all active orgs
- [ ] `triggers/send-notification` — deliver via chat + email
- [ ] `profile/weekly-refresh` — re-scrape brand website, update profile
- [ ] `intelligence/competitor-scan` — check Meta Ad Library for competitor activity

---

## PHASE 9: POLISH & LAUNCH PREP (Day 25-28)
**Goal: Production-quality experience**

### 9.1 Error States
- [ ] Network error: "Kunde inte ansluta. Kontrollera din internetanslutning."
- [ ] API rate limit: "Du har gjort för många förfrågningar. Vänta en minut."
- [ ] Tool failure: "Något gick fel med [steg]. Försök igen."
- [ ] Platform rejection: "Meta godkände inte din annons. Anledning: [reason]."
- [ ] All errors: retry button + contact support link

### 9.2 Empty States
- [ ] Analytics: "Inga kampanjer ännu. Skapa din första annons!"
- [ ] Campaigns: "Du har inga aktiva kampanjer."
- [ ] Settings: pre-filled from brand analysis

### 9.3 Onboarding Polish
- [ ] First-time user experience: animated welcome, clear first step
- [ ] Tooltip on "Börja med att skriva in ditt företags URL här..."
- [ ] Progress indicator: "Steg 1/4: Analyserar..."
- [ ] Celebration moment: confetti/animation when first ad is created

### 9.4 Mobile Optimization
- [ ] Test entire flow on iPhone 14/15
- [ ] Test on iPad
- [ ] Fix any overflow/scrolling issues
- [ ] Ensure touch targets are 44px minimum
- [ ] Test landscape orientation

### 9.5 SEO & Marketing
- [ ] Meta tags on landing page (title, description, OG image)
- [ ] Favicon and app icon
- [ ] robots.txt and sitemap.xml
- [ ] Landing page copy: clear value prop, social proof, CTA

---

## PHASE 10: LAUNCH (Day 29-30)
**Goal: Ship it**

### 10.1 Pre-Launch Checklist
- [ ] All P0 items from audit are resolved
- [ ] Auth works end-to-end (signup → chat → publish → dashboard)
- [ ] At least Meta campaign deployment works live
- [ ] Stripe billing: free trial + pro plan
- [ ] Rate limiting active
- [ ] Sentry + Langfuse + PostHog all receiving data
- [ ] GDPR deletion endpoint works
- [ ] Error states tested for all tool failures
- [ ] Mobile tested on 3 devices
- [ ] Load test: 10 concurrent users

### 10.2 Soft Launch
- [ ] Invite 10 beta users (personal network)
- [ ] Monitor Sentry for errors
- [ ] Monitor Langfuse for LLM costs
- [ ] Monitor PostHog for funnel drop-offs
- [ ] Collect feedback: what's confusing, what's broken, what's missing
- [ ] Fix top 5 issues from beta feedback

### 10.3 Public Launch
- [ ] Enable Clerk signup for everyone
- [ ] Announce on LinkedIn, Twitter, Product Hunt
- [ ] Monitor: errors, costs, signups, conversions
- [ ] Respond to support requests within 1 hour
- [ ] Daily standup: what broke, what to fix

---

## TIMELINE SUMMARY

| Phase | Days | What | Outcome |
|-------|------|------|---------|
| 1. Clean House | 1-2 | Remove dead code, fix consistency | Clean codebase |
| 2. Auth & Tenancy | 3-5 | Clerk, orgId, RLS | Multi-user isolated |
| 3. Security | 6-7 | Rate limits, CORS, HMAC, encryption | Hardened |
| 4. Real Deployment | 8-12 | Meta + Google APIs, Inngest, Stripe | Ads actually deploy |
| 5. Performance | 13-15 | Metrics polling, performance alerts | Users see ROI |
| 6. Dashboards | 16-19 | Analytics, campaigns, settings | Full SaaS |
| 7. Observability | 20-21 | Sentry, Langfuse, PostHog | Know what's happening |
| 8. Triggers | 22-24 | Proactive AI notifications | Users come back |
| 9. Polish | 25-28 | Error states, mobile, onboarding | Production quality |
| 10. Launch | 29-30 | Beta → public | SHIPPED |

**Total: 30 days to production.**
