# DoostAI Full Professional Audit Prompt

> Copy everything below the line and paste it into a new Claude Code session (or any capable AI assistant) with access to the DoostAI codebase.

---

## Role

You are simultaneously:

1. **A seasoned CTO** with 15+ years building SaaS products — you care about architecture, scalability, DX, security, observability, and shipping velocity.
2. **A senior full-stack engineer** — you read every line, spot anti-patterns, find bugs, and suggest concrete code improvements.
3. **A product designer** with deep expertise in conversational AI interfaces, ad-tech dashboards, and B2B SaaS — you think in user journeys, micro-interactions, and emotional design.
4. **An SME business owner** (the actual customer) — a Swedish company with 5-50 employees, limited marketing knowledge, no time to learn complex tools. You judge everything from "would I understand this? would I trust this? would I come back?"

## Context

DoostAI is a conversational AI marketing platform. Users paste a company URL, we scrape their brand identity, enrich with company data, and generate ready-to-publish ad campaigns for Meta, Google, and LinkedIn — all through a chat interface.

Before starting, read these files thoroughly:
- `CLAUDE.md` — Tech stack, repo structure, coding standards
- `PIPELINE.md` — The exact 8-stage flow (Entry → Scraping → Profile → Copy → Creatives → Review → Deploy → Live)
- `LIVING-PROFILE.md` — The customer intelligence system (the soul of the product)

## Task

Perform a **complete professional audit** of the entire DoostAI codebase and product design. Be brutally honest. Don't hold back. I want world-class output — money is not a constraint, the product needs to be exceptional and have a clear USP.

Structure your audit in these sections:

---

### SECTION 1: Architecture & Code Quality Audit

For every package and app in the monorepo, review:

**1.1 — Database Schema (`packages/db/`)**
- Review all Drizzle schemas. Are they normalized correctly? Missing indexes? Missing RLS policies?
- Is `jsonb` used appropriately or are we stuffing too much into unstructured columns?
- Are the relationships between tables correct? Missing foreign keys?
- Is the Living Profile data model (3 layers) properly represented in the schema?
- Suggest schema changes with actual Drizzle code

**1.2 — AI System (`packages/ai/`)**
- Review all agents, prompts, and tools
- Is the model routing logic correct? Are we using the right model for each task?
- Are prompts well-structured? Evaluate prompt engineering quality
- Is Langfuse tracing properly implemented?
- Review the campaign state machine — is it robust?
- Is streaming properly handled with Vercel AI SDK?
- Evaluate cost efficiency — are we wasting tokens anywhere?

**1.3 — Brand Extraction (`packages/brand/`)**
- Review Firecrawl integration. Is the scraping reliable?
- Review Roaring.io / Clearbit enrichment. Error handling? Fallbacks?
- Is the profile builder correctly assembling Layer 1 of the Living Profile?
- Are we extracting everything we could from a URL?

**1.4 — Platform Integrations (`packages/platforms/`)**
- Review Meta, Google, LinkedIn API clients
- Is token encryption (AES-256-GCM) implemented correctly and securely?
- Are rate limits handled properly?
- Is the adapter pattern well-implemented?
- Review OAuth flows for each platform
- Are there any security vulnerabilities in token storage/refresh?

**1.5 — Templates & Rendering (`packages/templates/`)**
- Review all ad templates (Meta minimal/split, Google standard/extended, LinkedIn corporate/insight)
- Is the Satori rendering pipeline efficient?
- Are templates responsive and do they produce high-quality output?
- Review the template registry and selection logic

**1.6 — Intelligence System (`packages/intelligence/`, `packages/triggers/`)**
- Is the trigger system properly implemented?
- Review behavior tracking — are we capturing the right signals?
- Is the cross-customer industry intelligence system functional?
- Review the weekly refresh cycle

**1.7 — Background Jobs (`lib/inngest/`)**
- Review ALL Inngest functions
- Are there race conditions? Idempotency issues?
- Is retry logic correct?
- Are long-running jobs properly chunked?
- Review the campaign deployment fan-out

**1.8 — API Routes & Middleware**
- Review all API routes in `app/api/`
- Is auth (Clerk) correctly applied everywhere?
- Are webhooks verified?
- Is rate limiting in place?
- Review error responses — consistent format?

**1.9 — Frontend Architecture**
- Is the App Router used correctly (Server vs Client components)?
- Are there performance issues (unnecessary re-renders, missing Suspense boundaries)?
- Is state management clean?
- Review the chat message flow from input to rendered response

**1.10 — Security Audit**
- OWASP Top 10 check across the entire codebase
- Review all places where user input touches the system
- Check for injection vulnerabilities (SQL, XSS, prompt injection)
- Review CORS, CSP, and other security headers
- Are API keys and secrets handled correctly?
- Is there proper input validation (Zod) at all boundaries?

**1.11 — Observability & Error Handling**
- Is Sentry properly configured? Are errors captured with context?
- Is PostHog tracking meaningful events?
- Are Langfuse traces useful for debugging AI issues?
- Are there blind spots where errors could go unnoticed?

**1.12 — Testing**
- What test coverage exists? What's missing?
- Suggest the most critical tests to add (highest ROI)
- Are there E2E tests for the core pipeline?

---

### SECTION 2: UX/UI Design Audit & Proposals

This section should include **concrete, detailed design specifications** — not vague suggestions. Describe layouts, colors, spacing, animations, component states. Think Figma-level detail in words.

**2.1 — Chat Interface Design**
- Current state assessment: Is the chat interface world-class or generic?
- **Propose a complete chat redesign** that makes DoostAI feel like a premium marketing co-pilot, not a chatbot:
  - Message bubble design (user vs AI, with brand personality)
  - How tool results render inline (brand cards, ad previews, performance charts)
  - Progressive loading states (skeleton → shimmer → content)
  - Micro-animations (typing indicator, card reveal, success celebrations)
  - Mobile responsiveness
  - Dark mode considerations
  - Suggestion chips design and positioning
  - How the chat adapts as the relationship deepens (Day 1 vs Day 90)

**2.2 — Brand Profile Card Design**
- Propose a **stunning brand profile card** that makes users go "wow, it really understands my company"
- 4-phase progressive reveal animation
- Color swatch interaction (click to edit)
- Company data layout (grid vs list vs cards)
- The "Marketing Readiness Score" visualization
- How competitors are displayed
- Social presence indicators
- How it looks when data is missing vs complete

**2.3 — Ad Preview Design**
- Propose **pixel-perfect ad preview components** for each platform:
  - Meta feed ad preview (matching Facebook's exact UI)
  - Meta story ad preview (full-screen mobile format)
  - Google Search ad preview (matching Google's exact SERP styling)
  - LinkedIn sponsored content preview (matching LinkedIn's feed)
- Variant comparison UI (side-by-side, swipeable, A/B winner highlight)
- Inline text editing interaction
- How the preview updates in real-time as the user edits

**2.4 — Dashboard & Analytics Design**
- Performance dashboard layout for an SME owner who doesn't understand marketing metrics
- How to visualize CTR, CPC, ROAS in a way a bakery owner would understand
- Weekly digest view (before it becomes an email)
- Campaign timeline visualization
- Industry benchmark comparison (how do I stack up?)

**2.5 — Onboarding Flow Design**
- The critical first 60 seconds: URL paste → brand analysis → "wow" moment
- Progressive registration (Level 0 → 1 → 2) — how to make each step feel natural, not gated
- How to communicate value before asking for anything

**2.6 — Component Library & Design System**
- Propose a cohesive design system for DoostAI
- Color palette (primary, secondary, accent, semantic colors)
- Typography scale
- Spacing system
- Component patterns (cards, buttons, badges, status indicators)
- Animation library (standard enter/exit/hover/loading patterns)
- Iconography style

---

### SECTION 3: Technical USP & Innovation Proposals

Propose **concrete technical features** that would make DoostAI genuinely unique — things competitors can't easily copy. For each proposal, include:
- What it is (user-facing description)
- Why it's a USP (competitive analysis)
- How to build it (technical architecture)
- Effort estimate (S/M/L/XL)
- Impact estimate (low/medium/high/critical)

Consider these areas:

**3.1 — AI Intelligence Differentiation**
- How can the Living Profile system become truly uncopyable?
- Creative DNA fingerprinting — what if every company had a unique "advertising genome"?
- Predictive performance scoring — "this ad will get 3.2% CTR" before running it
- Auto-A/B testing with multi-armed bandit algorithms
- Natural language performance queries ("which of my ads works best on Tuesdays?")

**3.2 — Real-time & Proactive Features**
- Push notifications when competitors launch new campaigns
- Auto-generated "morning brief" for each customer
- Real-time budget reallocation when one channel outperforms
- Seasonal campaign auto-generation

**3.3 — Creative Generation Innovation**
- AI-powered brand consistency checker (does this ad match my brand?)
- Dynamic creative optimization (different versions for different audiences)
- Template marketplace where high-performing templates are shared (anonymized)
- Video ad generation pipeline

**3.4 — Data Flywheel Amplification**
- How to accelerate the cross-customer learning network
- Industry-specific AI fine-tuning
- Embedding-based creative recommendation engine
- Churn prediction based on engagement patterns

**3.5 — Integration & Platform Innovation**
- One-click website pixel installation
- CRM integration (HubSpot, Pipedrive) for conversion tracking
- E-commerce integration (Shopify, WooCommerce) for ROAS
- Slack/Teams integration for approvals

**3.6 — Pricing & Business Model Innovation**
- Performance-based pricing ("we only charge when your ads perform")
- Credit system for AI image/video generation
- Agency white-label features
- Referral engine powered by the product itself

---

### SECTION 4: Priority Roadmap

Based on everything above, create a prioritized roadmap:

**Phase 1: Foundation (Weeks 1-4)**
- Critical bugs and security issues to fix immediately
- Architecture changes that unblock everything else
- The ONE design change that has the biggest impact

**Phase 2: Core Experience (Weeks 5-12)**
- Features that make the core flow (URL → Live ads) world-class
- The design system implementation
- The most impactful USP feature

**Phase 3: Intelligence Mode (Weeks 13-24)**
- Living Profile layers 2 and 3
- Cross-customer intelligence
- Proactive notification system

**Phase 4: Scale (Weeks 25+)**
- Agency features
- Video generation
- International expansion
- API/SDK for partners

---

### SECTION 5: Specific Code Fixes

For every issue found in Section 1, provide:
- File path and line number
- What's wrong
- The fix (actual code diff or new code)
- Severity: critical / high / medium / low

---

## Output Format

- Use clear headers and subheaders
- Use code blocks with language annotations for all code suggestions
- Use tables for comparisons
- Be specific — "improve the UX" is worthless, "add a 300ms ease-out fade when the brand card enters, starting from 20px below its final position" is useful
- For design proposals, describe the visual in enough detail that a designer could implement it without asking questions
- Total length: as long as needed. Thoroughness > brevity for this audit.

## Important

- Read EVERY file in the codebase before starting. Don't make assumptions about what's implemented.
- Compare what's specified in CLAUDE.md/PIPELINE.md/LIVING-PROFILE.md against what's actually built.
- Think from the SME customer perspective first, then engineer perspective.
- Be specific about what makes us BETTER than competitors like Smartly.io, AdCreative.ai, Pencil, and Canva's ad tools.
- Swedish market context matters — we launch in Sweden first.
- Don't suggest "nice to haves" — everything should earn its place by making the product meaningfully better or creating a defensible advantage.
