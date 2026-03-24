# Doost AI — Claude Code Build Kit

## What's in this package

| File | Purpose |
|------|---------|
| `README.md` | This file — how to use everything |
| `CLAUDE.md` | **The brain.** Put this in your project root. Claude Code reads it automatically for context on every prompt. Contains: tech stack, repo structure, coding standards, design decisions, commands. |
| `PROMPTS.md` | **The playbook.** 15 step-by-step prompts to paste into Claude Code. Each builds on the previous. Takes you from empty directory to deployed product. |
| `schema.ts` | **The data model.** Complete Drizzle ORM schema with 8 tables, all types, relations, and indexes. Reference this when Claude Code builds the DB layer. |
| `env.example` | **All environment variables.** Every API key and config value the app needs. Copy to `.env.local` and fill in. |
| `setup.sh` | **Quick start script.** Run once to set up the project directory, copy files, and check prerequisites. |

---

## How to build Doost AI

### Step 0: Prerequisites (30 minutes)

Create accounts and get API keys. You need all of these before starting:

| Service | What to do | Time |
|---------|-----------|------|
| **Clerk** | Create app, get publishable + secret keys | 5 min |
| **Supabase** | Create project, get DB URL + service role key | 5 min |
| **Anthropic** | Get API key for Claude | 2 min |
| **OpenAI** | Get API key for GPT-4o | 2 min |
| **Firecrawl** | Sign up, get API key | 2 min |
| **Stripe** | Create account, get test keys | 5 min |
| **Vercel** | Create account, link GitHub | 5 min |
| **Meta Business** | Create Business Manager, start verification | 10 min |
| **Google Ads** | Create MCC account, apply for developer token | 10 min |
| **LinkedIn Dev** | Apply for Advertising API access | 5 min |

**Critical:** Meta Business Verification and LinkedIn API access can take days/weeks. Apply NOW, build in parallel.

### Step 1: Run setup (2 minutes)

```bash
chmod +x setup.sh
./setup.sh
```

This creates the project directory, copies all reference files, and creates `.env.local`.

### Step 2: Fill in environment variables (15 minutes)

Open `.env.local` and paste in all your API keys from Step 0.

### Step 3: Open Claude Code

```bash
cd doost
claude
```

Claude Code automatically reads `CLAUDE.md` from the project root. This gives it full context about the tech stack, architecture, and coding standards.

### Step 4: Follow the prompts (4-18 weeks)

Open `PROMPTS.md` and paste each prompt into Claude Code, one at a time:

| Phase | Prompts | What you build | Time |
|-------|---------|---------------|------|
| **1. Foundation** | 1.1 – 1.4 | Monorepo, auth, database, chat UI | Week 1-2 |
| **2. Brand Intelligence** | 2.1 – 2.3 | URL scraping, company enrichment, brand profiles | Week 3-4 |
| **3. Ad Generation** | 3.1 – 3.3 | Templates, AI copywriter, ad previews in chat | Week 5-8 |
| **4. Platform Integration** | 4.1 – 4.4 | Meta, Google, LinkedIn APIs, campaign deployment | Week 9-14 |
| **5. Optimization & Billing** | 5.1 – 5.3 | Analytics, Stripe billing, onboarding polish | Week 15-18 |
| **Deploy** | D.1 | Vercel production deployment | Week 18 |

**Rules for using the prompts:**
- Always wait for the previous prompt to complete before starting the next
- Test each step manually before moving on
- If something fails, fix it before proceeding
- You can ask Claude Code follow-up questions within the same prompt session
- If you need to modify a prompt, add your changes at the end, don't edit the base prompt

### Step 5: Deploy

After completing all prompts, run Prompt D.1 to deploy to Vercel.

---

## Architecture overview

```
User → Chat UI (Next.js + Vercel AI SDK)
         ↓
       API Route (streamText with tools)
         ↓
    ┌────┴─────────────────────┐
    │                          │
  analyze_brand         generate_ads
    │                          │
  Firecrawl              Copywriter Agent
  Roaring.io             (Claude + GPT-4o)
    │                          │
  Brand Profile          Creative Director
  (Supabase)             (Templates + Satori)
                               │
                         Ad Previews
                         (React components)
                               │
                        deploy_campaign
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                  Meta     Google    LinkedIn
                  API       API        API
                    │          │          │
                    └──────────┼──────────┘
                               │
                        Performance Polling
                        (Inngest cron, 6h)
                               │
                        Optimization Agent
                               │
                        Weekly Digest Email
```

---

## Key design decisions explained

**Why chat-first?** Every competitor uses dashboards. Dashboards have learning curves. Chat has zero learning curve. The chat is the entire product — brand analysis, ad generation, campaign deployment, and performance monitoring all happen through conversation.

**Why templates over AI-generated images?** AI image generation (DALL-E, Midjourney) can't guarantee brand consistency. A B2B SaaS company needs its exact hex colors, its exact logo placement, its exact font. Templates give us 100% control. We add AI image generation later as an enhancement, not the foundation.

**Why create ad accounts for customers?** Friction kills conversion. If a user has to leave our app to create a Google Ads account, 80% won't come back. For Google, we use MCC's CreateCustomerClient. For Meta, we create under our Business Manager. Only LinkedIn requires customer OAuth.

**Why Nordic-first?** No direct competitor exists in the Nordics. Roaring.io gives us rich company data (revenue, employees, industry codes) that global platforms can't match. The Nordic B2B SaaS ecosystem (Stockholm specifically) is dense enough to reach 100 customers through direct outreach.

**Why Inngest over BullMQ?** Inngest is serverless-native — no Redis to manage, no worker processes to scale. It handles retries, rate limiting, and scheduling out of the box. Perfect for ad platform API calls that need careful rate management.

---

## Cost to run (monthly estimates)

| Stage | Monthly cost | Revenue |
|-------|-------------|---------|
| Development (0 customers) | ~€50 | €0 |
| Beta (10 customers) | ~€150 | €0 (free pilots) |
| Launch (50 customers) | ~€400 | €15,000 |
| Growth (500 customers) | ~€3,000 | €150,000 |
| Scale (5,000 customers) | ~€25,000 | €1,500,000 |

AI API costs are the main variable. Everything else scales cheaply on serverless.
