# Doost AI — System Audit Report
Generated: 2026-03-25

## Scorecard

| # | Category | Score | Issues |
|---|----------|-------|--------|
| 1 | Repository structure | 6/10 | 17 of 34 dirs missing, 0 critical |
| 2 | Environment variables | 10/10 | All 47 vars present, pooler correct |
| 3 | Database schema | 4/10 | 7 of 15 tables missing from live schema, 9 brand_profiles fields missing |
| 4 | Auth & security | 3/10 | Middleware disabled, no rate limiting, unprotected API routes |
| 5 | Chat system | 7/10 | All tools + UI present; no context injection or windowing |
| 6 | Brand intelligence | 3/10 | Scrape + enrich work; entire intelligence package missing |
| 7 | Ad generation | 8/10 | Copywriter, caching, templates, creative director all work; pre-render stub |
| 8 | Platform integrations | 7/10 | All 3 platforms implemented; no idempotent deploy, no Google token refresh |
| 9 | Behavior & triggers | 0/10 | Nothing implemented — packages/intelligence/ and packages/triggers/ don't exist |
| 10 | Performance & optimization | 6/10 | Model routing + caching + pooling work; no R2, no lazy loading |
| 11 | Registration & billing | 3/10 | Stripe webhooks work; no progressive reg, no guest sessions, no spend billing |
| 12 | Observability | 8/10 | Sentry + Langfuse + PostHog all set up; health endpoint is shallow |
| 13 | Security | 6/10 | Token encryption + no secrets leak; no CORS, weak input validation |
| 14 | Code quality | 7/10 | Zero `any` types; 11 empty catches, 6 TODOs, inconsistent API format |
| 15 | LIVING-PROFILE compliance | 2/10 | Layer 1 partial; Layers 2-3 not built; 0 of 7 triggers; no AI context |

**Overall: 80/150 (53%)**

---

## Auto-fixed issues (🔧)

None in this audit run — report only.

---

## Critical issues (❌)

### Database (Audit 3)

- **7 tables missing from live schema** (`packages/db/src/schema/index.ts`): `social_presence`, `google_reviews`, `competitor_tracking`, `competitor_ads`, `behavior_signals`, `profile_triggers`, `website_audits`. They exist in `reference/schema.ts` but were never migrated.
- **9 brand_profiles fields missing**: `tone_formality`, `tone_warmth`, `tone_urgency`, `enrichment_status`, `performance_profile`, `behavior_profile`, `profile_completeness`, `social_presence_score`, `marketing_readiness_score`.
- **No idempotent deployment** (8.7): No `deployments` table, no idempotency keys. Inngest retries WILL create duplicate campaigns and double ad spend.

### Auth (Audit 4)

- **Middleware is a no-op** (4.1): `middleware.ts` has empty matcher — all routes public.
- **No ClerkProvider** (4.2): Client-side auth hooks will fail.
- **`/api/chat` unprotected** (4.3): Anyone can call the AI endpoint and consume credits.
- **No rate limiting** (4.5): No `@upstash/ratelimit` on any endpoint.

### Intelligence (Audit 6)

- **`packages/intelligence/` does not exist** (6.3–6.6): No social detection, Google reviews, competitor tracking, or website audit.
- **No retry or timeout on Firecrawl** (6.1): If Firecrawl hangs, the request blocks indefinitely.
- **Profile components missing** (6.9): None of the 6 progressive profile components (IdentityCard, SocialPresence, CompetitorRadar, ReadinessScore, ProfileCompletion, LiveProfileView) exist.

### Behavior & Triggers (Audit 9)

- **`packages/triggers/` does not exist** (9.3): 0 of 7 proactive triggers implemented.
- **No `trackChatBehavior()`** (9.1): No behavior tracking from chat.
- **No `buildAIContext()`** (9.2): AI starts cold every session with static prompt.

### LIVING-PROFILE (Audit 15)

- **AI-as-colleague not functional** (15.6): System prompt is static — no customer context, winning patterns, tone preferences, or competitor data injected.
- **Network effect not built** (15.5): `embeddingsUpdate` is a stub, no pgvector.
- **0 of 7 triggers** (15.4): The proactive system (key differentiator) doesn't exist.

### Billing (Audit 11)

- **No weekly ad spend billing** (11.5): We'd be paying for customer ad spend without billing them.
- **No guest sessions** (11.2): Anonymous users lose everything on refresh.
- **Plan enforcement hardcoded to "pro"** (11.4): Everyone gets unlimited access.

### Security (Audit 13)

- **No CORS** (13.1): API is wide open to any origin.

---

## Warnings (⚠️)

| # | Issue | Location |
|---|-------|----------|
| 6.7 | `Promise.all` instead of `Promise.allSettled` for scrape+enrich | `apps/web/app/api/chat/route.ts` |
| 6.8 | Profile builder only merges scrape+Roaring; no intelligence sources | `packages/brand/src/profile-builder.ts` |
| 7.5 | Pre-render Inngest function is a stub (TODO) | `apps/web/lib/inngest/functions/creatives-pre-render.ts` |
| 7.6 | Langfuse tracing only in copywriter, not in profile builder | `packages/brand/src/profile-builder.ts` |
| 8.4 | Some adapter methods return stubs | `packages/platforms/src/adapter.ts` |
| 8.6 | No Google token refresh cron | Missing from Inngest functions |
| 10.3 | No React.lazy or next/dynamic for ad preview components | `apps/web/components/ads/` |
| 10.5 | R2 storage not integrated — creatives not uploaded | No `@aws-sdk/client-s3` usage |
| 12.4 | Health endpoint doesn't check DB/Redis/dependencies | `apps/web/app/api/health/route.ts` |
| 13.5 | Zod validation only in chat tools; other routes use unsafe casts | Multiple API routes |
| 14.2 | 3 `console.log` in production code (stubs) | Inngest function stubs |
| 14.3 | 11 empty catch blocks across 8 files | Various |
| 14.4 | 6 TODO comments in production code | See list below |
| 14.5 | Inconsistent API response format | Only 1 route uses `{ success, data?, error? }` |

### TODO comments

1. `apps/web/app/api/webhooks/stripe/route.ts:109` — Send warning email via Resend
2. `apps/web/components/brand/brand-profile-card.tsx:228` — Upload PDF to extract colors
3. `apps/web/lib/inngest/functions/weekly-digest.ts:47` — Send via Resend
4. `apps/web/lib/inngest/functions/linkedin-deploy.ts:63` — Use brand profile URL
5. `apps/web/lib/inngest/functions/google-deploy.ts:79` — Use brand profile URL
6. `apps/web/lib/inngest/functions/creatives-pre-render.ts:18` — Render to R2

---

## Passing checks (✅)

| # | Check | Details |
|---|-------|---------|
| 1.2 | turbo.json pipelines | All 5 present (build, dev, lint, typecheck, test) |
| 1.3 | Root package.json scripts | All 8 present |
| 1.4 | .gitignore | All 8 required entries present |
| 1.5 | TypeScript strict mode | Enabled in base.json, inherited by all packages |
| 1.6 | Package aliases | All 4 working (@doost/db, ai, platforms, brand) |
| 2.1 | .env.example | All 47 variables present with comments |
| 2.2 | .env.local critical keys | DATABASE_URL and ANTHROPIC_API_KEY set |
| 2.3 | DATABASE_URL pooler | Port 6543, pgbouncer=true |
| 2.4 | DIRECT_URL | Port 5432 for migrations |
| 3.3 | org_id + indexes | All tenant-scoped tables in live schema have org_id FK + index |
| 3.4 | FK relationships | All present FKs are correct |
| 4.4 | Token encryption | AES-256-GCM with random IV, key validated |
| 5.1 | streamText + model routing | Full intent classification + multi-model routing |
| 5.2 | Chat tools | All 9 tools registered (7 required + 2 bonus) |
| 5.5 | Chat UI components | All 8 components exist |
| 6.2 | enrichCompany / Roaring | Mock mode, graceful not-found handling |
| 7.1 | generateAdCopy | Sonnet hero + GPT-4o variants, Zod limits, retry |
| 7.2 | Copy caching | SHA-256 keys, 1h TTL, bulk invalidation |
| 7.3 | Template system | 6 templates, Satori + resvg-js renderer |
| 7.4 | Creative director | Industry-aware template selection + rendering |
| 8.1 | Meta integration | Full client, auth, campaigns with rate limiting |
| 8.2 | Google integration | Full client, auth, campaigns with GAQL injection prevention |
| 8.3 | LinkedIn integration | Full client, auth, campaigns with mock mode |
| 8.4 | AdPlatformAdapter | Interface + factory + 3 implementations |
| 8.5 | OAuth callbacks | All 3 routes, Clerk-authed, tokens encrypted |
| 8.8 | Parallel deployment | Promise.allSettled fan-out in campaign-deploy.ts |
| 10.1 | Edge caching | 24h unstable_cache + Cache-Control headers |
| 10.2 | DB connection pooling | prepare: false, port 6543 |
| 10.4 | Model routing | Haiku/Sonnet/GPT-4o per intent |
| 10.6 | Inngest | 16 functions registered at /api/inngest |
| 12.1 | Sentry | 3 config files, DSN-guarded |
| 12.2 | Langfuse | Tracing in copywriter + model router |
| 12.3 | PostHog | Provider with EU endpoint |
| 13.2 | Webhook verification | Stripe signature verified |
| 13.3 | No hardcoded secrets | Clean codebase |
| 13.4 | Token encryption | AES-256-GCM implemented |
| 14.1 | Zero `any` types | No `: any` or `as any` anywhere |

---

## Top 5 Priorities

1. **Migrate reference schema to live DB** — The 7 missing tables and 9 brand_profiles fields are the foundation for Layers 2-3 of the Living Profile. Nothing else works without them.

2. **Build `packages/intelligence/`** — Social detection, Google reviews, competitor tracking, and website audit are the core data pipeline that makes profiles "living." Currently only scrape + Roaring enrichment exists.

3. **Enable auth + rate limiting** — The chat endpoint consuming AI credits is completely unprotected. Re-enable Clerk middleware, add `@upstash/ratelimit` to `/api/chat`.

4. **Build `packages/triggers/`** — The 7 proactive triggers are the key product differentiator. Without them, Doost is just another ad tool.

5. **Implement `buildAIContext()`** — The AI needs to inject customer behavior, winning patterns, and competitor data into every conversation. Currently it starts from zero every time.
