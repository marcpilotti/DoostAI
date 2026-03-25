# PROMPTS.md — Doost AI Build Prompts

> Each prompt builds on the previous. Follow in order.
> Read CLAUDE.md + PIPELINE.md + LIVING-PROFILE.md before starting.

---

## Prompt 2.4 — Social presence detection

Build packages/intelligence/social-detection.ts:
- Function: detectSocialPresence(url, companyName)
- Three detection methods in parallel: HTML scan, platform search, URL patterns
- Extract: URL, name, followers, last post date, post frequency, isActive
- Calculate overall social_presence_score (0-100)
- Save to social_presence table
- Create apps/web/components/profile/SocialPresence.tsx (Phase 2 in chat)

## Prompt 2.5 — Competitor intelligence

Build packages/intelligence/competitor-radar.ts:
- Function: getCompetitorIntel(brandProfile, competitorNames)
- Search Meta Ad Library API for active competitor ads
- Quick-scrape competitor websites for tagline/description
- Analyze with Claude Haiku: common formats, messaging themes, gaps
- Save to competitor_tracking + competitor_ads tables
- Create apps/web/components/profile/CompetitorRadar.tsx (Phase 3 in chat)
- Weekly Inngest refresh: intelligence/refresh-competitors

## Prompt 2.6 — Website audit and readiness score

Build packages/intelligence/website-audit.ts:
- Function: auditWebsite(url, scrapeData)
- Call Google PageSpeed Insights API (mobile + desktop)
- Detect tracking pixels: Meta Pixel, Google Tag, LinkedIn Insight
- Detect tech stack, sitemap, SSL, contact form, blog, pricing page
- Generate issues list with severity + impact
- Calculate readiness_score (0-100) with breakdown
- Save to website_audits table
- Create apps/web/components/profile/ReadinessScore.tsx (Phase 4 in chat)

## Prompt 2.7 — Behavior tracking system

Build packages/intelligence/behavior-tracker.ts:
- Function: trackChatBehavior(orgId, messages, creativeEdits)
- Analyze WITHOUT asking: edit patterns, approval speed, platform preference, tone adjustments
- Save signals to behavior_signals table (append-only)
- Aggregate function: aggregateBehaviorProfile(orgId)
- Hook into chat system: track after every message/edit/approval silently
- Inject behavior profile into AI context (buildAIContext from LIVING-PROFILE.md)

## Prompt 2.8 — Proactive trigger system

Build packages/triggers/:
- definitions.ts: 7 triggers from LIVING-PROFILE.md (competitor_new_campaign, performance_drop, seasonal_opportunity, ad_fatigue, new_google_reviews, ready_to_scale, budget_waste)
- engine.ts: evaluateTriggers(orgId) — checks conditions + respects cooldowns
- notifications.ts: notifyUser(orgId, notification) — chat card + email
- Inngest cron: triggers/evaluate-all (every 6h, 30min after performance poll)
- Create apps/web/components/chat/TriggerNotification.tsx
