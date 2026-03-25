# DoostAI — Complete Professional Audit
Generated: 2026-03-25

---

# SECTION 1: Architecture & Code Quality Audit

## Executive Summary

The crypto, schema structure, and brand extraction logic are **solid foundations**. The AI model routing, template system, and ad copy generation pipeline are well-designed. However, there are **10 CRITICAL issues** that make this system impossible to ship to production:

1. Authentication entirely disabled
2. No RLS policies on any table
3. OAuth CSRF vulnerability (unsigned state)
4. Campaign deployment is entirely mocked
5. Customer ads point to doost.tech instead of their own website
6. Two conflicting model routers
7. `useGpt` parameter ignored — Opus used for everything (3-4x cost overrun)
8. Brand profiles never persisted from chat flow
9. LinkedIn token refresh breaks after first cycle (IV not updated)
10. Zero rate limiting on any endpoint

---

## 1.1 — Database Schema

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| DB-1 | **CRITICAL** | No RLS policies defined anywhere — any user can read/modify any tenant's data | Add RLS policies to every tenant-scoped table via Supabase migrations |
| DB-2 | **CRITICAL** | `updatedAt` never auto-updates — only set at INSERT time | Add PostgreSQL trigger `set_updated_at()` on every table |
| DB-3 | HIGH | `conversations.messages` is unbounded JSONB array — can't query individual messages, hits row size limits | Extract to `conversation_messages` table |
| DB-4 | HIGH | `creativePerformance` has no unique constraint on `(creative_id, date)` — poll retries create duplicates | Add `uniqueIndex("perf_creative_date_uniq")` |
| DB-5 | HIGH | Missing composite index `(org_id, status)` on campaigns | Add `index("campaign_org_status_idx")` |
| DB-6 | MEDIUM | `refreshTokenIv` buried in JSONB metadata — fragile casts, no enforcement | Promote to typed column |
| DB-7 | MEDIUM | `enrichmentStatus` is raw text, not an enum | Create `pgEnum("enrichment_status")` |
| DB-8 | MEDIUM | No `cooldown` column on `profileTriggers` | Add timestamp column for trigger cooldown |

---

## 1.2 — AI System

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| AI-1 | **CRITICAL** | Two conflicting model routers: `packages/ai/src/router.ts` vs `apps/web/lib/utils/model-router.ts` — different models for same tasks | Delete `apps/web/lib/utils/model-router.ts` entirely |
| AI-2 | **CRITICAL** | `useGpt` parameter ignored in copywriter.ts — Opus 4.6 used for ALL variants (3-4x cost overrun) | Wire the parameter: `const model = useGpt ? openai("gpt-4o") : anthropic("claude-opus-4-6")` |
| AI-3 | HIGH | No Langfuse tracing on the main `streamText()` chat call | Wrap in Langfuse trace using `onFinish` callback |
| AI-4 | HIGH | Copy cache key uses `brand.name` as fallback — cache collisions between similar company names | Make `brandProfileId` required in `CopyOptions` |
| AI-5 | HIGH | CSS color override is naive frequency-based — navigation colors can outrank true brand colors | Add semantic context analysis or use LLM's judgment when CSS data is noisy |
| AI-6 | MEDIUM | `flushTraces()` blocks response latency | Fire-and-forget with `void flushTraces()` |
| AI-7 | MEDIUM | `buildAIContext()` from LIVING-PROFILE.md never implemented — AI has no customer memory | Implement per-session context injection |

---

## 1.3 — Brand Extraction

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| BE-1 | HIGH | No timeout on Firecrawl — hangs indefinitely if service is slow | Add `AbortSignal.timeout(15_000)` |
| BE-2 | HIGH | Random mock data (org numbers, employee counts) storable in production | Guard with `NODE_ENV === "production"` check |
| BE-3 | HIGH | No SSRF protection on URL input — users can probe internal networks | Validate against blocked domain list before calling Firecrawl |
| BE-4 | MEDIUM | Domain extraction doesn't handle subdomains correctly | Improve URL parsing |
| BE-5 | MEDIUM | `enrichedIndustry` filter bypassed — line 144 uses unfiltered `enrichment?.industry` | Change to `enrichedIndustry ?? object.industry` |

---

## 1.4 — Platform Integrations

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| PI-1 | **CRITICAL** | OAuth state parameter is unsigned — CSRF / account takeover vulnerability | Sign state with HMAC-SHA256 |
| PI-2 | **CRITICAL** | Authentication middleware is completely disabled — all routes public | Restore Clerk middleware immediately |
| PI-3 | **CRITICAL** | `/api/chat` has no auth — anyone can burn API credits | Add `auth()` check |
| PI-4 | **CRITICAL** | `/api/brand/update-colors` accepts unauthenticated mutations | Add auth + ownership check |
| PI-5 | **CRITICAL** | `/api/brand/[id]` exposes company data publicly | Add auth |
| PI-6 | HIGH | Meta adapter `refreshToken()` returns empty string silently | Throw error or implement properly |
| PI-7 | HIGH | Google/LinkedIn adapter pause/resume/uploadCreative are silent no-ops | Wire to real client methods or throw |
| PI-8 | HIGH | `campaign-deploy.ts` hardcodes `finalUrl: "https://doost.tech"` | Use brand profile URL from campaign |
| PI-9 | HIGH | LinkedIn refresh stores new token without updating IV — breaks after first cycle | Capture and store new IV |

---

## 1.5 — Templates

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| TM-1 | HIGH | `__dirname` in ESM module crashes in Next.js 15 | Use `import.meta.url` + `fileURLToPath` |
| TM-2 | HIGH | No error boundary around `renderToImage` — one failed render crashes entire generation | Wrap in try/catch per template |
| TM-3 | MEDIUM | Hardcoded white text — unreadable on light brand colors | Compute contrast-aware text color |
| TM-4 | MEDIUM | Google Search templates render images unnecessarily (text-only ad format) | Skip rendering for Google Search |

---

## 1.7 — Background Jobs

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| IJ-1 | **CRITICAL** | Campaign deployment entirely mocked — `deploy_campaign` never calls Inngest | Wire the tool to emit `campaign/deploy` event |
| IJ-2 | HIGH | Weekly digest loads 500 orgs at once — no pagination | Cursor-based pagination in batches of 50 |
| IJ-3 | HIGH | Embeddings job is completely fake (`console.log` only) | Implement or remove |
| IJ-4 | HIGH | Google deploy uses placeholder "Headline 1" and doost.tech URL | Pass real copy and brand URL |
| IJ-5 | HIGH | Brand analysis not persisted from chat route | Emit Inngest event for DB persistence |
| IJ-6 | MEDIUM | Insights polling overwrites single-day snapshot instead of writing time-series | Write to `creativePerformance` table |
| IJ-7 | MEDIUM | Retry enrichment uses `brandProfileId: "pending"` — always fails | Pass actual profile ID |

---

## 1.8 — API Routes

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| AR-1 | **CRITICAL** | `/api/campaigns` is a stub returning empty array | Implement CRUD |
| AR-2 | HIGH | Zero rate limiting on any endpoint | Add `@upstash/ratelimit` |
| AR-3 | HIGH | No CORS headers configured | Add CORS middleware restricting to doost.tech |
| AR-4 | HIGH | Stripe checkout doesn't verify org membership | Verify userId belongs to orgId |
| AR-5 | MEDIUM | `check_plan` hardcoded to "pro" for everyone | Query actual plan from DB |

---

## 1.10 — Security Scorecard

| OWASP Category | Status | Details |
|----------------|--------|---------|
| A01: Broken Access Control | ❌ **FAIL** | No auth middleware, no RLS, no ownership checks |
| A02: Cryptographic Failures | ✅ PASS | AES-256-GCM token encryption correctly implemented |
| A03: Injection | ⚠️ PARTIAL | GAQL injection prevented in Google client; no SSRF protection on Firecrawl URLs |
| A04: Insecure Design | ❌ **FAIL** | OAuth state unsigned, demo mode in production paths |
| A05: Security Misconfiguration | ❌ **FAIL** | No CORS, no CSP headers, auth disabled |
| A06: Vulnerable Components | ✅ PASS | Dependencies are current |
| A07: Auth Failures | ❌ **FAIL** | 5 critical unauthenticated endpoints |
| A08: Data Integrity | ⚠️ PARTIAL | No idempotent deployment, duplicate performance data possible |
| A09: Logging Failures | ⚠️ PARTIAL | Sentry + Langfuse configured but main chat call untraced |
| A10: SSRF | ⚠️ RISK | URL input passed to Firecrawl without validation |

---

# SECTION 4: Priority Roadmap

## Phase 1: Foundation (Weeks 1-4) — "Ship-Safe"

**Week 1: Security lockdown (CRITICAL)**
1. Restore Clerk middleware — all routes protected
2. Add RLS policies to every tenant-scoped table
3. Sign OAuth state with HMAC-SHA256
4. Add `auth()` to chat, brand, campaigns routes
5. Add Upstash rate limiting to `/api/chat` (10 req/min)
6. Add CORS headers restricting to doost.tech
7. Guard Roaring mock with `NODE_ENV !== "production"`

**Week 2: Data integrity**
1. Fix `enrichedIndustry` bypass (line 144 in profile-builder)
2. Delete duplicate model router (`apps/web/lib/utils/model-router.ts`)
3. Wire `useGpt` parameter in copywriter
4. Fix LinkedIn refresh token IV not updating
5. Add `updatedAt` trigger on all tables
6. Add unique constraint on `(creative_id, date)`
7. Fix `finalUrl` hardcoding — use brand URL

**Week 3: Persistence + deployment**
1. Persist brand profile to DB from chat route
2. Wire `deploy_campaign` tool to emit Inngest event
3. Fix Google deploy placeholder copy
4. Fix `brandProfileId: "pending"` in retry enrichment
5. Add Firecrawl timeout (15s AbortSignal)
6. Fix `__dirname` in template renderer

**Week 4: Plan enforcement + API**
1. Remove hardcoded `plan: "pro"` — query real subscription
2. Implement campaigns API (CRUD)
3. Add Langfuse trace on main `streamText()` call
4. Add org membership check on Stripe checkout

## Phase 2: Core Experience (Weeks 5-12)

- Implement `buildAIContext()` — inject customer data into every chat
- Build `packages/intelligence/` — social detection, Google reviews, competitor tracking, website audit
- Implement the 4-phase progressive profile rendering
- Add conversation windowing for long sessions
- Implement R2 storage for ad creatives
- Build real campaigns dashboard

## Phase 3: Intelligence Mode (Weeks 13-24)

- Build `packages/triggers/` — all 7 proactive triggers
- Implement behavior tracking from chat interactions
- Build cross-customer industry intelligence with pgvector
- Performance profile extraction (winning/losing patterns)
- Weekly digest emails via Resend
- Progressive registration (anonymous → email → card)

## Phase 4: Scale (Weeks 25+)

- Video ad generation pipeline
- Agency white-label features
- International expansion (Norway, Finland, Denmark)
- Slack/Teams integration for approvals
- E-commerce integrations (Shopify, WooCommerce)
- Performance-based pricing model

---

# SECTION 5: Critical Code Fixes (Top 10)

These are the fixes that should be made **before any new feature work**:

### Fix 1: Restore authentication (middleware.ts)
```typescript
// apps/web/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/inngest(.*)",
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
```

### Fix 2: Delete duplicate model router
```bash
rm apps/web/lib/utils/model-router.ts
```

### Fix 3: Wire useGpt in copywriter (packages/ai/src/agents/copywriter.ts:91-93)
```typescript
const model = useGpt ? openai("gpt-4o") : anthropic("claude-opus-4-6");
const modelName = useGpt ? "gpt-4o" : "claude-opus-4-6";
```

### Fix 4: Fix enrichedIndustry bypass (packages/brand/src/profile-builder.ts:144)
```typescript
// Change:
industry: enrichment?.industry ?? object.industry,
// To:
industry: enrichedIndustry ?? object.industry,
```

### Fix 5: Fix LinkedIn refresh token IV (apps/web/lib/inngest/functions/linkedin-tokens.ts)
```typescript
const { encrypted: refreshEnc, iv: refreshIv } = encryptToken(refreshToken);
await db.update(adAccounts).set({
  refreshTokenEncrypted: refreshEnc,
  metadata: { ...account.metadata, refreshTokenIv: refreshIv },
});
```

### Fix 6: Fix finalUrl hardcoding (apps/web/lib/inngest/functions/campaign-deploy.ts)
```typescript
// Replace hardcoded "https://doost.tech" with:
const brandProfile = await db.select().from(brandProfiles)
  .where(eq(brandProfiles.id, campaign.brandProfileId)).limit(1);
const finalUrl = brandProfile[0]?.url ?? campaign.targeting?.landingPage ?? "https://doost.tech";
```

### Fix 7: Add rate limiting to chat route
```typescript
// apps/web/app/api/chat/route.ts — top of POST handler
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m") });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) return new Response("Too many requests", { status: 429 });
  // ... rest of handler
}
```

### Fix 8: Sign OAuth state
```typescript
// packages/platforms/src/oauth-state.ts (new file)
import { createHmac, randomBytes } from "crypto";

const secret = process.env.OAUTH_STATE_SECRET!;

export function createSignedState(payload: Record<string, string>): string {
  const data = JSON.stringify({ ...payload, nonce: randomBytes(8).toString("hex") });
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${Buffer.from(data).toString("base64url")}.${sig}`;
}

export function verifySignedState(state: string): Record<string, string> | null {
  const [data, sig] = state.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", secret).update(Buffer.from(data, "base64url")).digest("base64url");
  if (sig !== expected) return null;
  return JSON.parse(Buffer.from(data, "base64url").toString());
}
```

### Fix 9: Add Firecrawl timeout (packages/brand/src/firecrawl.ts)
```typescript
const doc = await client.scrape(normalizedUrl, {
  formats: ["html", "markdown"],
  timeout: 15000, // 15 second timeout
});
```

### Fix 10: Persist brand profile from chat route
```typescript
// In analyze_brand tool execute, after buildBrandProfile:
const { rawScrapeData: _s, rawEnrichmentData: _e, ...cleanProfile } = profile;

// Fire background job for DB persistence
inngest.send({
  name: "brand/analyze",
  data: {
    url,
    orgId: "demo-org", // TODO: replace with auth().orgId when auth is enabled
    profile: cleanProfile,
  },
}).catch(() => {}); // fire-and-forget
```

---

# SECTION 2: UX/UI Design Audit

## 2.1 — Chat Interface

**Current state:** Functional but generic — a competent shadcn/ui implementation indistinguishable from any SaaS starter kit. The rainbow glow, animate-message-in, and frosted glass cards are good touches. But the AI avatar has no state differentiation, markdown renders as raw text, no timestamps, user bubbles feel like comment boxes.

**Critical fixes:**
1. **Add react-markdown** — AI generates Swedish text with `**bold**`, numbered lists, headers. Currently renders as raw asterisks. One component change for massive quality uplift.
2. **AI avatar states** — pulsing gradient ring during "thinking", static after response
3. **User bubbles** — gradient background (`linear-gradient(135deg, #eef2ff, #e0e7ff)`) with `border-radius: 18px 18px 4px 18px`
4. **AI messages** — subtle left-accent line (`2px gradient indigo→transparent, opacity 0.3`)
5. **Empty state hero** — full opacity (currently 80%), `text-[52px]` (currently 44px), subtitle `text-base` (currently `text-sm text-muted-foreground/70` = nearly invisible)
6. **Rainbow glow** — only animate to full opacity on focus, subtle at rest

## 2.2 — Brand Profile Card

**Current state:** Single flat reveal, all-or-nothing. The completion score is crude (4 fields × 25%). No progressive phases despite PIPELINE.md specifying +2s/+3s/+5s/+6s reveal.

**4-phase progressive reveal:**
- Phase 1 (+0ms): Identity — name, URL, colors, industry
- Phase 2 (+800ms): Social presence — platforms found, follower counts
- Phase 3 (+2000ms): Competitor radar — 3 competitors with ad activity
- Phase 4 (+2600ms): Readiness score — animated 0→score counter with cubic ease-out

Each phase enters with `translateY(20px) → 0` + `blur(4px) → 0` at `cubic-bezier(0.16, 1, 0.3, 1)`.

## 2.3 — Ad Previews

**Pixel-level issues:**
- Meta: profile avatar should show actual logo, not letter initial. Missing "i" icon, page category label. ThumbsUp icon shape is wrong (Lucide vs Meta's actual thumb)
- Google: missing Ad Strength indicator, rating stars, sitelinks from brand data
- LinkedIn: CTA should be filled button, not outlined. Missing "Follow" button
- **Missing entirely:** Story/Reel format (40% of Meta spend). Add 9:16 aspect ratio preview with full-bleed gradient and swipe-up CTA

## 2.4 — Dashboard/Analytics

**Design for SME owners who don't understand ROAS:**
- Replace "CTR" → "Andel som klickar", "CPC" → "Kostnad per klick", "ROAS" → "Avkastning"
- Every metric card needs a **verdict** ("Bra!", "Okej", "Kan bli bättre") and industry percentile
- AI weekly summary: "Din bästa annons den här veckan var X — den klickades 47% mer"
- Campaign list: progress bar with actual days, spend in kronor, not abstract percentages

## 2.5 — Onboarding (First 60 Seconds)

**Current flow is backwards** — onboarding (logo/font/connectors) fires AFTER the profile card. The font upload step confuses 95% of SME owners who don't have .ttf files. Connector buttons don't work (no onClick handlers).

**Revised "wow" timeline:**
- 0s: "Skippa byrån." + URL input
- 3s: Input border shimmer animation while scraping
- 5s: Phase 1 brand card slides up (THEIR colors, THEIR logo) — the "holy shit" moment
- 7s: Phase 2 — social presence discovered
- 9s: Phase 3 — competitors identified
- 11s: Phase 4 — readiness score animates
- 15s: One question: "Vad är er målsättning?" with 4 chips
- 30s: Channel picker → ad generation begins

**Kill the blocking 3-step onboarding.** Logo: pull from scrape, editable in card. Font: skip for MVP. Connectors: ambient step later, not blocking.

## 2.6 — Design System

**Issues found:**
- `animate-shimmer` referenced everywhere but **keyframe never defined** — all loading states are broken (static, not animating)
- `--brand-blue` and `--brand-teal` defined but orphaned
- Primary disappears in dark mode (becomes near-white)
- No semantic color tokens (uses raw Tailwind emerald/amber/blue directly)

**Missing animation:**
```css
@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
.animate-shimmer { animation: shimmer 1.5s ease-in-out infinite; }
```

---

# SECTION 3: Technical USP & Innovation Proposals

## 3.1 — AI Intelligence Differentiation

| Proposal | What | Effort | Impact |
|----------|------|--------|--------|
| **Creative DNA Engine** | Vector embeddings of ad creatives + performance → few-shot examples in copy generation. Uses pgvector (already in Supabase). | M | **XL** |
| **Predictive Performance Scoring** | "This ad will likely achieve 0.8–1.2% CTR" before running it. Confidence intervals from historical data per industry/platform. | L | L (grows to XL at scale) |
| **Auto A/B Testing** | Launch every campaign with 2 variants. Z-test for significance at 95% confidence. Auto-pause loser. Zero user input required. | **S** | L |
| **Natural Language Analytics** | "Vilken vecka gick det bäst?" → structured query → inline chart in chat. Extends chat-first philosophy to analytics. | M | M |

## 3.2 — Real-time & Proactive

| Proposal | What | Effort | Impact |
|----------|------|--------|--------|
| **Competitor Alerts** | Weekly Meta Ad Library polling. When 3+ new ads detected from competitor → chat notification + "Generate response campaign" CTA. | M | L |
| **Morning Brief** | Monday 08:00: 3 numbers + 1 action + 1 insight. Chat message + email via Resend. The #1 weekly retention driver. | **S** | **M** |
| **Auto Budget Reallocation** | When one channel outperforms, auto-shift budget. "Approve this change" button in trigger notification. | M | L |

## 3.3 — Creative Generation

| Proposal | What | Effort | Impact |
|----------|------|--------|--------|
| **Brand Consistency Checker** | Color distance check (CIEDE2000 deltaE < 10), logo presence validation before any creative ships. | **S** | M |
| **Dynamic Creative Optimization** | Generate 8 permutations (2 headlines × 2 bodies × 2 CTAs). Use Meta's `asset_feed_spec` — it handles rotation natively. Parameter change, not infrastructure. | **S** | **L** |
| **Template Marketplace** | 20-30 templates per platform with benchmark CTR data. Organized by industry × objective. | L | M |

## 3.4 — Data Flywheel

| Proposal | What | Effort | Impact |
|----------|------|--------|--------|
| **Cross-Customer Intelligence** | Weekly aggregation of creative_performance by industry/platform → industry_benchmarks table. New customers get instant priors. The genuine moat. | M | **XL** (compounds) |
| **Churn Prediction** | Logistic regression on session frequency + campaign activity + trigger response rate. Score > 0.7 → proactive intervention. | S | M |

## 3.5 — Integrations

| Proposal | What | Effort | Impact |
|----------|------|--------|--------|
| **Pixel Installation Wizard** | Detect missing pixels (already done), generate personalized `<script>` tag + CMS-specific instructions. Closes the ROAS tracking loop. | **S** | **XL** |
| **Slack Integration** | Morning briefs + competitor alerts + performance drops delivered to Slack. OAuth webhook. | S | M |

## 3.6 — Pricing Innovation

| Proposal | What | Effort | Impact |
|----------|------|--------|--------|
| **Performance-Based Tier** | 0% monthly fee + 3% of managed ad spend. Aligns incentives. 500 kr/day = 450 kr/month (≈ Starter plan). Zero-friction entry. | L | **XL** |
| **Agency White-Label** | Subdomain, custom branding, client management, reseller margin. | XL | L |

---

# Competitive Moat Analysis

**The genuine moat is NOT the pipeline, chat interface, or templates.** Those are replicable in weeks.

**The moat is the Living Profile.** After 90 days of use, Doost knows:
- Your Creative DNA (which headlines/colors/CTAs convert for YOU)
- Your behavioral preferences (tone, control level, platform preference)
- Your competitive landscape (who's running what)
- Your industry position (percentile vs. peers)

**Starting over at a competitor means losing all of that.** This data compounds and is non-portable. No competitor offers this at the SME price point.

vs. **Smartly.io**: Enterprise-only (€2,000+), no AI copy, complex UI, weeks to learn. Doost wins on accessibility + intelligence.
vs. **AdCreative.ai**: Image generation only, no deployment, no monitoring. Doost wins on end-to-end pipeline.
vs. **Pencil**: D2C video focus, requires existing performance data. Doost wins on SME accessibility + full pipeline.
vs. **Canva**: Design tool, no AI, no deployment, no intelligence. Minimal overlap.
