# Doost AI — Production Deployment

## 1. Vercel Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link project (run from repo root)
vercel link

# Set root directory to apps/web in Vercel Dashboard:
# Settings > General > Root Directory: apps/web
# Build Command: cd ../.. && pnpm turbo build --filter=web
# Output Directory: .next
# Install Command: pnpm install
```

## 2. Environment Variables

Add all variables from `.env.local` to Vercel Dashboard > Settings > Environment Variables.

Critical production values to update:

| Variable | Production value |
|----------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://doost.tech` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production key from Clerk |
| `CLERK_SECRET_KEY` | Production key from Clerk |
| `DATABASE_URL` | Production Supabase URL |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard > Webhooks |
| `INNGEST_SIGNING_KEY` | From Inngest Dashboard |
| `INNGEST_EVENT_KEY` | From Inngest Dashboard |
| `SENTRY_DSN` | From Sentry project |
| `NEXT_PUBLIC_SENTRY_DSN` | Same DSN |
| `NEXT_PUBLIC_POSTHOG_KEY` | From PostHog project |

## 3. Custom Domain

In Vercel Dashboard > Settings > Domains:
- Add `doost.tech`
- Add `www.doost.tech` (redirects to apex via vercel.json)

DNS records (at your registrar):
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com.
```

## 4. Supabase Production

1. Create a new Supabase project for production
2. Run schema push: `DATABASE_URL=<prod-url> pnpm db:push`
3. Apply RLS migration: run `infrastructure/supabase/migrations/00001_enable_rls.sql`
4. Set the production `DATABASE_URL` in Vercel env vars

## 5. Clerk Production

1. In Clerk Dashboard, create a Production instance
2. Set sign-in/sign-up URLs to `/sign-in` and `/sign-up`
3. Set after-auth redirect to `/chat`
4. Copy production keys to Vercel env vars

## 6. Stripe Webhooks

1. In Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://doost.tech/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

## 7. Inngest

1. Sign up at inngest.com
2. Set `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` in Vercel
3. After first deploy, Inngest auto-discovers functions at `/api/inngest`
4. Verify 10 functions registered in Inngest Dashboard

## 8. Ad Platforms

| Platform | Status | Action needed |
|----------|--------|--------------|
| Meta | Apply for Business Verification | business.facebook.com |
| Google Ads | Apply for Basic Access (test token works for now) | ads.google.com |
| LinkedIn | Apply for Advertising API access | developer.linkedin.com |

## 9. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main (auto-deploys if GitHub integration is connected)
git push origin main
```

## 10. Post-Deploy Checklist

- [ ] `https://doost.tech` loads the landing page
- [ ] `https://doost.tech/api/health` returns `{"status":"ok"}`
- [ ] `https://doost.tech/sign-in` shows Clerk sign-in
- [ ] Sign in redirects to `/chat`
- [ ] Chat sends messages and receives AI responses
- [ ] `https://doost.tech/api/inngest` returns `function_count: 10`
- [ ] Stripe webhook test event succeeds
- [ ] Sentry captures test error
- [ ] PostHog receives pageview events
