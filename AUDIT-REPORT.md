# Doost AI — System Audit Report
Generated: 2026-03-25 (second audit, post-fixes)

## Scorecard

| # | Category | Score | Prev | Delta | Issues |
|---|----------|-------|------|-------|--------|
| 1 | Repository structure | 10/10 | 6 | +4 | All 34 dirs exist, all scripts, strict TS |
| 2 | Environment variables | 10/10 | 10 | — | All 47+ vars, pooler correct |
| 3 | Database schema | 8/10 | 4 | +4 | All 15 tables + 9 LP fields; 5 missing relations, some missing updatedAt |
| 4 | Auth & security | 3/10 | 3 | — | Middleware still disabled, no rate limiting |
| 5 | Chat system | 7/10 | 7 | — | All tools + UI; no context injection or windowing |
| 6 | Brand intelligence | 4/10 | 3 | +1 | temperature:0, CSS override; intelligence package still stub |
| 7 | Ad generation | 8/10 | 8 | — | Full pipeline; pre-render stub |
| 8 | Platform integrations | 7/10 | 7 | — | All 3 platforms; no idempotent deploy, no Google refresh cron |
| 9 | Behavior & triggers | 1/10 | 0 | +1 | DB tables exist now; code still stub |
| 10 | Performance & optimization | 7/10 | 6 | +1 | React.lazy added; no R2 |
| 11 | Registration & billing | 3/10 | 3 | — | Stripe works; no progressive reg, no spend billing |
| 12 | Observability | 9/10 | 8 | +1 | Health now checks DB+Redis |
| 13 | Security | 6/10 | 6 | — | Encryption solid; no CORS, weak validation |
| 14 | Code quality | 8/10 | 7 | +1 | Zero any, zero empty catches; 7 TODOs, 3 console.logs |
| 15 | LIVING-PROFILE compliance | 3/10 | 2 | +1 | Layer 1 schema complete; Layers 2-3 unbuilt |

**Overall: 94/150 (63%)** — up from 80/150 (53%)

---

## Improvements since last audit (+14 points)

| Fix | Impact |
|-----|--------|
| 17 missing directories created | Repo structure 6→10 |
| 7 tables + 9 fields migrated to live schema | DB schema 4→8 |
| Promise.allSettled in analyze-brand | Resilience |
| React.lazy for 8 components | Performance 6→7 |
| Health endpoint checks DB+Redis | Observability 8→9 |
| Langfuse tracing in profile-builder | Observability |
| temperature:0 + CSS color override | Brand quality 3→4 |
| Empty catch blocks → logged | Code quality 7→8 |
| behavior_signals + profile_triggers tables exist | LIVING-PROFILE 2→3 |

---

## Critical issues still open (❌)

### Auth (must fix before production)
- **Middleware disabled** — all routes public, no Clerk protection
- **No ClerkProvider** — client-side auth hooks broken
- **`/api/chat` unauthenticated** — anyone can consume AI credits
- **No rate limiting** — no `@upstash/ratelimit` anywhere
- **No CORS** — API open to any origin

### Intelligence (core differentiator not built)
- **`packages/intelligence/`** — stub only, 4 functions missing: detectSocialPresence, getGooglePresence, getCompetitorIntel, auditWebsite
- **`packages/triggers/`** — stub only, 0 of 7 triggers implemented
- **No `buildAIContext()`** — AI starts cold every session
- **No `trackChatBehavior()`** — no behavior learning

### Infrastructure gaps
- **No idempotent deployment** — retries create duplicate campaigns
- **No R2 storage** — creatives not uploaded
- **No Google token refresh cron** — tokens expire after 1 hour
- **No conversation windowing** — will hit context limits on long sessions
- **No progressive registration / guest sessions**
- **No weekly ad spend billing**

---

## Warnings (⚠️)

| Issue | Location |
|-------|----------|
| 5 DB tables missing Drizzle relations (adAccounts, conversations, adTemplates, behaviorSignals, profileTriggers) | packages/db/src/schema/index.ts |
| 5 tables missing updatedAt field (creativePerformance, adTemplates, competitorAds, profileTriggers, websiteAudits) | packages/db/src/schema/index.ts |
| New intelligence tables missing org_id index (social_presence, google_reviews, competitor_tracking, competitor_ads, website_audits) | packages/db/src/schema/index.ts |
| deploy_campaign runs in demo/simulation mode | apps/web/app/api/chat/route.ts |
| check_plan hardcoded to "pro" | apps/web/app/api/chat/route.ts |
| creativesPreRender is a stub | apps/web/lib/inngest/functions/creatives-pre-render.ts |
| uploadCreative returns "pending" in all adapters | packages/platforms/src/adapter.ts |
| scrapeBrand has no timeout or retry | packages/brand/src/firecrawl.ts |
| No 4-phase progressive profile rendering | Single blocking tool call |
| Stripe checkout/portal routes lack Zod validation | apps/web/app/api/stripe/ |
| Inconsistent API response format | Multiple routes |
| 6 profile components from CLAUDE.md not created | apps/web/components/profile/ |
| streamText main chat call not Langfuse-traced | apps/web/app/api/chat/route.ts |

### TODO comments (7)

1. `apps/web/lib/inngest/functions/creatives-pre-render.ts:18` — Render to R2
2. `apps/web/lib/inngest/functions/google-deploy.ts:79` — Use brand profile URL
3. `apps/web/lib/inngest/functions/linkedin-deploy.ts:63` — Use brand profile URL
4. `apps/web/lib/inngest/functions/weekly-digest.ts:47` — Send via Resend
5. `apps/web/app/api/webhooks/stripe/route.ts:109` — Send warning email
6. `packages/intelligence/index.ts:2` — Implement intelligence functions
7. `packages/triggers/index.ts:2` — Implement triggers

---

## Passing checks (✅)

| Category | Checks passing |
|----------|---------------|
| Repo structure | All 34 dirs, turbo.json, scripts, .gitignore, strict TS, aliases |
| Environment | All 47+ vars, pooler, DIRECT_URL |
| DB schema | 15/15 tables, 9/9 LP fields, all FKs correct, cascade deletes |
| Token encryption | AES-256-GCM, random IV, key validated |
| Chat tools | 9 tools registered (7 required + 2 bonus) |
| Chat UI | All components exist (ChatMessages, CopyPreviewCard, etc.) |
| streamText + routing | Multi-model routing with intent classification |
| Brand scraping | Firecrawl + HTML fallback, CSS color extraction |
| Roaring enrichment | Mock mode, graceful not-found, null on error |
| Profile builder | temperature:0, CSS override post-processing, Langfuse traced |
| Ad copy | Sonnet hero + GPT-4o variants, Zod limits, retry |
| Copy caching | SHA-256 keys, 1hr TTL, bulk invalidation |
| Templates | 6 templates, Satori + resvg-js renderer |
| Creative director | Industry-aware selection + rendering |
| Meta/Google/LinkedIn | Full client + auth + campaigns for all 3 |
| Platform adapter | Interface + factory + 3 implementations |
| OAuth callbacks | All 3 routes, encrypted tokens, idempotent upsert |
| Meta/LinkedIn token refresh | Daily crons with 7/14 day lookahead |
| Parallel deployment | Promise.allSettled fan-out |
| Sentry | 3 config files, DSN-guarded |
| Langfuse | Tracing in copywriter + profile-builder + router |
| PostHog | Provider + helpers + feature flags |
| Health endpoint | DB + Redis checks, 200/503 status |
| No secrets in code | All from process.env |
| Zero `any` types | Strict throughout |
| Zero empty catches | All have fallback/comment |
| React.lazy | 8+ components lazy-loaded |
| DB pooling | prepare:false, port 6543 |
| 16 Inngest functions | All registered and routed |

---

## Top 5 priorities

1. **Enable auth + rate limiting** — `/api/chat` is unprotected. Re-enable Clerk middleware, add Upstash ratelimit, configure CORS.

2. **Build `packages/intelligence/`** — 4 functions (social, reviews, competitors, website audit) power the Living Profile. Schema exists, code doesn't.

3. **Build `packages/triggers/`** — 7 proactive triggers are the key differentiator. Schema + Inngest cron scaffold exist.

4. **Implement `buildAIContext()` + `trackChatBehavior()`** — Dynamic AI context injection makes the product feel intelligent. Currently the AI starts cold.

5. **Idempotent deployment + R2 storage** — Prevent duplicate campaigns on retry, store creatives in CDN.
