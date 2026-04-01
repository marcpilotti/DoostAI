# CLAUDE.md — Doost AI

## Required reading

Before starting ANY task, also read these files in the project root:
- **PIPELINE.md** — The exact flow of the system (8 stages)
- **LIVING-PROFILE.md** — How the customer profile works (the soul of the product)

These three files together (CLAUDE.md + PIPELINE.md + LIVING-PROFILE.md) define the entire product.

## Identity

Doost AI is a conversational AI marketing platform. Users paste a company URL, we scrape their brand identity, enrich with company data, and generate ready-to-publish ad campaigns for Meta, Google, and LinkedIn — all through a chat interface.

## Tech Stack (non-negotiable)

| Layer | Tool | Version |
|-------|------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x (strict mode) |
| Monorepo | Turborepo | latest |
| Styling | Tailwind CSS + shadcn/ui | latest |
| Database | Supabase (PostgreSQL 16) | latest |
| ORM | Drizzle ORM | latest |
| Auth | Clerk | latest |
| Chat SDK | Vercel AI SDK | 5.x |
| AI Models | Anthropic (Claude), OpenAI (GPT-4o) | latest |
| Background Jobs | Inngest | latest |
| Cache | Upstash Redis | latest |
| Object Storage | Cloudflare R2 (S3-compatible) | - |
| Payments | Stripe | latest |
| Email | Resend | latest |
| Analytics | PostHog | latest |
| Monitoring | Sentry | latest |
| AI Observability | Langfuse | latest |
| Deployment | Vercel | - |

## Repository Structure

```
doost/
├── apps/
│   ├── web/                    # Main Next.js application
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   │   │   ├── (dashboard)/    # Authenticated app
│   │   │   │   ├── chat/       # Main chat interface
│   │   │   │   ├── campaigns/  # Campaign management
│   │   │   │   ├── analytics/  # Performance dashboard
│   │   │   │   └── settings/   # Account settings
│   │   │   ├── (marketing)/    # Public marketing pages
│   │   │   ├── api/
│   │   │   │   ├── chat/       # Chat streaming endpoint
│   │   │   │   ├── brand/      # Brand analysis endpoints
│   │   │   │   ├── campaigns/  # Campaign CRUD
│   │   │   │   ├── platforms/  # Ad platform OAuth callbacks
│   │   │   │   ├── webhooks/   # Stripe, platform webhooks
│   │   │   │   └── inngest/    # Inngest event handler
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── chat/           # Chat UI components
│   │   │   ├── ads/            # Ad preview components
│   │   │   ├── brand/          # Brand profile components
│   │   │   ├── profile/        # Customer profile components
│   │   │   │   ├── IdentityCard.tsx
│   │   │   │   ├── SocialPresence.tsx
│   │   │   │   ├── CompetitorRadar.tsx
│   │   │   │   ├── ReadinessScore.tsx
│   │   │   │   ├── ProfileCompletion.tsx
│   │   │   │   └── LiveProfileView.tsx
│   │   │   └── ui/             # shadcn/ui components
│   │   └── lib/
│   │       ├── ai/             # AI client setup
│   │       ├── db/             # Drizzle client
│   │       └── utils/          # Shared utilities
│   └── marketing/              # Marketing site (future)
├── packages/
│   ├── db/                     # Database schema & migrations
│   │   ├── schema/
│   │   │   ├── organizations.ts
│   │   │   ├── brand-profiles.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── ad-creatives.ts
│   │   │   ├── ad-accounts.ts
│   │   │   ├── conversations.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   └── drizzle.config.ts
│   ├── ai/                     # AI agents & prompts
│   │   ├── agents/
│   │   │   ├── brand-analyst.ts
│   │   │   ├── copywriter.ts
│   │   │   ├── creative-director.ts
│   │   │   ├── campaign-manager.ts
│   │   │   └── optimizer.ts
│   │   ├── prompts/
│   │   │   ├── brand-analysis.ts
│   │   │   ├── ad-copy.ts
│   │   │   └── optimization.ts
│   │   └── tools/
│   │       ├── scrape-brand.ts
│   │       ├── enrich-company.ts
│   │       ├── generate-creative.ts
│   │       └── deploy-campaign.ts
│   ├── platforms/              # Ad platform API clients
│   │   ├── meta/
│   │   │   ├── client.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── creatives.ts
│   │   │   └── auth.ts
│   │   ├── google/
│   │   │   ├── client.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── creatives.ts
│   │   │   └── auth.ts
│   │   └── linkedin/
│   │       ├── client.ts
│   │       ├── campaigns.ts
│   │       ├── creatives.ts
│   │       └── auth.ts
│   ├── brand/                  # Brand extraction
│   │   ├── firecrawl.ts
│   │   ├── roaring.ts
│   │   ├── profile-builder.ts
│   │   └── types.ts
│   ├── templates/              # Ad creative templates
│   │   ├── meta/
│   │   ├── google/
│   │   ├── linkedin/
│   │   └── renderer.ts
│   ├── intelligence/           # Customer intelligence system
│   │   ├── social-detection.ts # Find social accounts
│   │   ├── google-reviews.ts   # Fetch Google Business Profile
│   │   ├── competitor-radar.ts # Meta Ad Library + competitor analysis
│   │   ├── website-audit.ts    # PageSpeed + pixel detection + content scan
│   │   ├── behavior-tracker.ts # Learn from chat behavior
│   │   └── industry-intel.ts   # Cross-customer industry patterns
│   ├── triggers/               # Proactive notification system
│   │   ├── definitions.ts      # All trigger definitions
│   │   ├── engine.ts           # Trigger evaluation engine
│   │   └── notifications.ts    # Notification delivery (chat + email)
│   └── config/                 # Shared configs
│       ├── tsconfig.json
│       ├── eslint.config.js
│       └── tailwind.config.ts
├── infrastructure/
│   └── supabase/
│       ├── migrations/
│       └── seed.sql
├── turbo.json
├── package.json
├── .env.example
├── .env.local                  # NEVER commit
└── CLAUDE.md                   # This file
```

## Coding Standards

### TypeScript
- Strict mode always (`"strict": true`)
- No `any` types — use `unknown` with type guards
- Zod for all external data validation
- Prefer `type` over `interface` unless extending
- Use `satisfies` for type checking object literals

### React / Next.js
- Server Components by default, `"use client"` only when needed
- Server Actions for mutations, Route Handlers for streaming/webhooks
- Suspense boundaries with loading.tsx for every route
- Error boundaries with error.tsx for every route
- Never use `useEffect` for data fetching — use Server Components or React Query

### Database
- Drizzle ORM exclusively — no raw SQL except in migrations
- Every table has: `id` (uuid, default gen_random_uuid()), `created_at`, `updated_at`
- Every tenant-scoped table has `org_id` with RLS policy
- Use `jsonb` for flexible/nested data (brand colors, performance metrics)
- Index foreign keys and commonly queried columns

### AI
- Vercel AI SDK `streamText()` for all chat responses
- Tool calls for structured actions (brand analysis, ad generation, campaign deployment)
- Langfuse tracing on every LLM call
- Prompt templates stored in `packages/ai/prompts/` — never inline strings
- Model routing: Claude Sonnet for quality copy, GPT-4o for speed, Haiku for chat

### Error Handling
- Custom error classes extending `Error`
- Never swallow errors — log to Sentry then re-throw or return error state
- API routes return consistent `{ success: boolean, data?: T, error?: string }`
- Inngest functions use built-in retry with exponential backoff

### Security
- All ad platform tokens encrypted with AES-256-GCM before storage
- Clerk middleware on all `/api/` and `/(dashboard)/` routes
- Supabase RLS enforced on every tenant-scoped table
- Rate limiting via Upstash on public endpoints
- CORS restricted to doost.tech domains

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- PR required for all merges to `main` and `develop`
- Branch naming: `feature/brand-scraping`, `fix/meta-token-refresh`
- Squash merge to keep history clean

## Key Design Decisions

1. **Chat-first UX**: The chat is the product. Every action (brand analysis, ad generation, campaign deployment) happens through the chat via AI tool calls that render React components inline.

2. **Template-first creatives**: We do NOT generate ad images with AI for MVP. We use HTML/CSS templates populated with brand colors, logos, and AI-generated copy, rendered to images via Satori. This guarantees brand consistency.

3. **Customer owns nothing**: For Google and Meta, we create ad accounts under our MCC/Business Manager. The customer never needs to create their own accounts. LinkedIn is the exception — customer must OAuth.

4. **Multi-model routing**: Different AI models for different tasks. Never use one model for everything. Route based on quality requirements and latency needs.

5. **Nordic-first**: Launch with Roaring.io for Swedish company data. Expand to Norway/Finland/Denmark in Phase 3. Non-Nordic companies use Clearbit/Breeze Intelligence.

## Environment Variables

See `.env.example` for complete list. Critical ones:
- `NEXT_PUBLIC_CLERK_*` — Clerk auth
- `DATABASE_URL` — Supabase connection string
- `ANTHROPIC_API_KEY` — Claude access
- `OPENAI_API_KEY` — GPT-4o access
- `FIRECRAWL_API_KEY` — Brand scraping
- `ROARING_API_KEY` — Nordic company data
- `META_APP_ID`, `META_APP_SECRET` — Meta Marketing API
- `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_MCC_ID` — Google Ads API
- `STRIPE_SECRET_KEY` — Payments
- `R2_*` — Cloudflare R2 storage
- `UPSTASH_REDIS_*` — Redis cache
- `INNGEST_*` — Background jobs

## Working Style

- Always use Plan Mode first. Read the relevant files, understand the current state, and present a plan BEFORE writing any code. Wait for approval before implementing.
- Think step-by-step. For complex tasks, break them into numbered phases. Complete one phase fully before starting the next.
- When in doubt, ask. Use AskUserQuestion to clarify ambiguous requirements before guessing.
- Show what you're going to change before you change it. For large refactors, list the files and the nature of each change first.

## Context Management

- Keep responses focused and concise. Don't repeat back instructions or explain what you're about to do at length — just do it.
- When context is getting long, proactively suggest compacting or starting a fresh session.
- Don't read files you don't need. Only pull in what's directly relevant to the current task.
- If told "focus on X," ignore everything that isn't X.

## Code Quality Rules

- After making changes, always verify: run the type-checker (`tsc --noEmit`), run existing tests, fix any failures.
- Match existing patterns in the codebase. Don't introduce new conventions, libraries, or architectural patterns without asking first.
- Preserve existing functionality. Make the minimum necessary change. Don't refactor, rename, or "improve" unrelated code.
- Never delete or overwrite code you don't understand. If something looks wrong but you're not sure, flag it — don't fix it silently.

## Design & UI Rules

- Never change visual design (colors, spacing, typography, layout, border-radius, shadows) unless explicitly asked.
- If a DESIGN_REFERENCE.md or design system file exists, treat it as law. Every UI change must comply.
- Use existing component libraries and design tokens. Don't create one-off styles.
- Mobile-first responsive principles unless told otherwise.

## File & Project Discipline

- Commit frequently with clear, descriptive commit messages. One logical change per commit.
- Don't modify config files (package.json, tsconfig, tailwind.config, .env) without telling me first.
- Don't install new dependencies without asking. Suggest and wait for approval.
- Keep file changes small and reviewable. If a task requires touching 10+ files, break it into smaller PRs.

## What NOT to Do

- Don't add comments explaining obvious code
- Don't add TODO comments unless asked
- Don't wrap things in try/catch "just in case" without understanding the error path
- Don't change formatting, whitespace, or import order in files you didn't otherwise modify
- Don't create files that weren't asked for (no random utils.ts, helpers.ts, or types.ts)
- Don't apologize or explain at length when you make a mistake — just fix it
- Don't add logging/console.log unless debugging a specific issue

## Communication

- When you hit a problem or are uncertain, say so immediately. Don't work around issues silently.
- If instructions conflict with each other or the codebase, point out the conflict and ask how to resolve it.
- After completing a task, give a brief summary: what changed, what files were touched, what to test.
- If a task is bigger than expected, say so before continuing. Re-scope rather than deliver half-finished work.

## Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm dev --filter=web       # Start web app only
pnpm db:generate            # Generate Drizzle migrations
pnpm db:push                # Push schema to Supabase
pnpm db:studio              # Open Drizzle Studio

# Testing
pnpm test                   # Run all tests
pnpm test:e2e               # Run Playwright E2E tests
pnpm lint                   # Lint all packages
pnpm typecheck              # TypeScript check all packages

# Build
pnpm build                  # Build all apps
pnpm clean                  # Clean all build artifacts

# Intelligence
pnpm intelligence:refresh    # Manually refresh all intelligence data for all orgs
pnpm triggers:run            # Manually run all triggers
```
