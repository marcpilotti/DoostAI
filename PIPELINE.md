# PIPELINE.md — Doost AI Production Pipeline Specification

> This file defines the EXACT flow of the Doost AI system.
> Every function, every decision point, every fallback.
> Claude Code: follow this pipeline exactly. Do not deviate.

---

## Pipeline overview

The system has 8 stages executed in strict order:

```
1. Entry → 2. Scraping → 3. Profile → 4. Copy → 5. Creatives → 6. Review → 7. Deploy → 8. Live
```

Each stage has:
- A primary path (happy path)
- Alternative paths (variations)
- Fallback paths (error handling)
- An exit condition that must be met before proceeding

---

## Stage 1: Entry

### Trigger
User opens the chat interface at `/chat`.

### Three entry paths

**Path A — New user (no brand profile exists)**
1. Show centered landing state: heading "Hur kan vi hjälpa dig med din marknadsföring?" + subtitle "Börja med att skriva in ditt företags URL" + prompt box
2. User types a message
3. Run URL detection on the message:
   ```typescript
   const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:com|se|io|ai|co|net|org|dev|app|tech|cloud|eu|no|fi|dk|de|uk|fr))/gi
   ```
4. If URL detected → proceed to Stage 2 automatically (do NOT ask "did you mean to analyze this URL?")
5. If no URL detected → respond conversationally, guide user to paste a URL

**Path B — Returning user (brand profile exists)**
1. Load brand profile from edge cache (stale-while-revalidate, 24h TTL)
2. Load conversation history from `conversations` table
3. AI greets with context: "Välkommen tillbaka! Du har en profil för [company]. Vill du skapa en ny kampanj, kolla statistik, eller optimera befintliga annonser?"
4. Show suggestion chips: "Ny kampanj", "Hur går mina annonser?", "Analysera ny URL"

**Path C — Agency user switching clients**
1. User selects client from sidebar dropdown or Cmd+K
2. Load that client's brand profile and campaign history
3. Switch Clerk organization context
4. AI acknowledges: "Bytt till [client name]. Vad vill du göra?"

### Exit condition
A URL has been identified and passed to Stage 2, OR user is on Path B/C and chooses an action.

### URL blocklist (never trigger analysis for these)
```typescript
const BLOCKED_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com',
  'github.com', 'stackoverflow.com', 'wikipedia.org',
  'amazon.com', 'apple.com', 'microsoft.com'
]
```

---

## Stage 2: Scraping

### Trigger
URL detected in Stage 1. Chat tool `analyze_brand` is called.

### Execution
Run Firecrawl and company enrichment in PARALLEL using `Promise.allSettled()`:

```typescript
const [scrapeResult, enrichmentResult] = await Promise.allSettled([
  scrapeBrand(url),            // Firecrawl Branding API
  enrichCompany(domain)         // Roaring.io or Clearbit
])
```

### Firecrawl scraping (REQUIRED — pipeline stops if this fails)

Call Firecrawl's scrape endpoint with the URL. Extract:
- `colors`: object with primary, secondary, accent, background, text (hex codes)
- `fonts`: object with heading and body font family names
- `logos`: array of image URLs (og:image, favicon, logo elements)
- `content`: page title, meta description, all visible text content
- `services`: extracted product/service descriptions
- `images`: array of key images from the site

If Firecrawl fails:
1. Retry once after 3 seconds
2. If retry fails: try Apify as fallback scraper
3. If both fail: show error in chat "Kunde inte analysera hemsidan. Kontrollera att URL:en stämmer och försök igen."
4. Pipeline STOPS. Do not proceed without scrape data.

### Company enrichment (OPTIONAL — pipeline continues without it)

**Decision: Nordic or global?**

```typescript
const NORDIC_TLDS = ['.se', '.no', '.fi', '.dk']
const isNordic = NORDIC_TLDS.some(tld => domain.endsWith(tld)) || await roaringLookup(domain)
```

**If Nordic → Roaring.io API:**
- Query by domain or company name
- Extract: company name, org number, industry codes (SNI), employee count, revenue, CEO, board members, address, credit rating
- Timeout: 5 seconds

**If NOT Nordic → Clearbit/Breeze Intelligence:**
- Query by domain
- Extract: company name, industry, employee range, revenue range, location, description
- Timeout: 5 seconds

**If enrichment fails (timeout, not found, API error):**
1. Log warning to Sentry (NOT an error — this is expected for some companies)
2. Set `brand_profiles.enrichment_status = 'pending'`
3. Schedule Inngest retry: `brand/retry-enrichment` with 30s delay, max 3 retries, exponential backoff
4. PROCEED to Stage 3 with scrape data only
5. When retry succeeds later: merge enrichment data into existing profile, update status to 'complete'

### What gets stored

```typescript
// Save raw data for debugging
brand_profiles.raw_scrape_data = scrapeResult
brand_profiles.raw_enrichment_data = enrichmentResult

// Enrichment status tracking
brand_profiles.enrichment_status = 'complete' | 'partial' | 'pending'
```

### Timing
- Target: <4 seconds total (parallel execution)
- Log to Langfuse: `scrape_duration_ms`, `enrichment_duration_ms`, `total_analysis_duration_ms`

### Exit condition
Firecrawl scrape data is available. Enrichment is available OR scheduled for retry.

---

## Stage 3: Profile assembly

### Trigger
Scrape data (and optionally enrichment data) available from Stage 2.

### Execution
Pass all data to Claude Haiku for structured profile assembly:

```typescript
const profile = await generateObject({
  model: anthropic('claude-haiku-4-5-20251001'),
  schema: BrandProfileSchema,  // Zod schema
  prompt: `
    Analyze this company data and create a structured brand profile.

    Website content: ${JSON.stringify(scrapeData)}
    Company data: ${JSON.stringify(enrichmentData || 'Not available')}

    Determine:
    1. Brand voice (formal/casual/playful/technical — one word + one sentence description)
    2. Target audience (who are they selling to — be specific)
    3. Top 3 value propositions (what makes them different)
    4. Top 3 likely competitors
    5. Best campaign objective for their business (awareness/traffic/conversions/leads)
  `
})
```

### What gets saved to `brand_profiles` table
```typescript
{
  org_id: currentOrgId,
  url: analyzedUrl,
  name: enrichment?.companyName || scrapeData.title,
  description: llmProfile.description,
  industry: enrichment?.industryCodes?.[0] || llmProfile.industry,
  industry_codes: enrichment?.industryCodes,
  employee_count: enrichment?.employeeCount,
  revenue: enrichment?.revenue,
  location: enrichment?.address || llmProfile.location,
  ceo: enrichment?.ceo,
  org_number: enrichment?.orgNumber,
  colors: scrapeData.colors,    // Can be edited by user later
  fonts: scrapeData.fonts,
  logos: scrapeData.logos,
  brand_voice: llmProfile.brandVoice,
  target_audience: llmProfile.targetAudience,
  value_propositions: llmProfile.valuePropositions,
  competitors: llmProfile.competitors,
  enrichment_status: enrichment ? 'complete' : 'pending',
}
```

### Chat display
Render `BrandProfileCard` component inline via Vercel AI SDK tool result:
- Company name + URL + "PROFIL KLAR" badge
- 2x2 grid: Bransch, Anställda, Omsättning, Plats
- Color swatches (clickable — opens color picker)
- AI summarizes: "Jag har analyserat [company]. Det är ett [industry]-bolag med [X] anställda..."

### User interaction paths at this stage

**Path A: "Ser bra ut!" (70% of users)**
→ Proceed to Stage 4

**Path B: User wants to correct something (25%)**
- "Färgerna stämmer inte" → Open color picker on swatches, user adjusts
- "Vi är inte inom [industry]" → Update industry field
- "Vi har [X] anställda, inte [Y]" → Update employee count
- After correction: save updated profile, regenerate any affected fields via Haiku
- Then proceed to Stage 4

**Path C: Wrong company / start over (5%)**
- User pastes a new URL → Archive current profile, restart from Stage 2

### Background task (triggered by profile creation)
Inngest event `brand.profile.created`:
1. Pre-render all 6 ad templates with brand colors + placeholder copy
2. Upload to R2: `previews/${orgId}/${brandProfileId}/${templateId}.png`
3. Store URLs in `brand_template_previews` table
4. This ensures Stage 5 has instant image previews available

### Suggestion chips shown after profile
```typescript
["Ser bra ut, generera annonser!", "Ändra färger", "Fel bransch", "Analysera annan URL"]
```

### Exit condition
Brand profile saved to database. User has confirmed or corrected the profile.

---

## Stage 4: Copy generation

### Trigger
User confirms brand profile (explicitly or via suggestion chip).

### Pre-step: Channel selection
AI asks: "Vilka kanaler vill du köra annonser på?"
Show suggestion chips: "Meta + Google + LinkedIn", "Bara Meta", "Meta + Google", "Bara Google"

If user doesn't specify → default to all three.

### Execution

**Step 4.1: Cache check**
```typescript
const cacheKey = `copy:${sha256(brandProfileId + platform + objective).slice(0, 16)}`
const cached = await redis.get(cacheKey)
if (cached) {
  // Log cache hit to Langfuse
  // Return cached hero copy (variants are NEVER cached)
  return JSON.parse(cached)
}
```

**Step 4.2: Hero copy generation (Claude Sonnet)**
For EACH selected platform, call Claude Sonnet with platform-specific prompt:

```typescript
// Meta prompt constraints
{ headline: '≤40 chars', body: '≤125 chars', cta: '≤20 chars' }

// Google Search prompt constraints
{ headlines: '3x ≤30 chars each', descriptions: '2x ≤90 chars each' }

// LinkedIn prompt constraints
{ intro: '≤150 chars', headline: '≤70 chars', cta: 'from predefined list' }
```

Prompt template (stored in `prompt_versions` table, not hardcoded):
```
You are an expert ad copywriter. Create advertising copy for {platform}.

Brand: {brandName}
Industry: {industry}
Target audience: {targetAudience}
Brand voice: {brandVoice}
Value propositions: {valuePropositions}
Campaign objective: {objective}

Requirements:
- {platform_specific_constraints}
- Write in Swedish unless the brand's website is in English
- Match the brand voice exactly
- Include a clear call-to-action
- Focus on the strongest value proposition

Return JSON: { headline, bodyCopy, cta }
```

**Step 4.3: A/B variants (GPT-4o — parallel with hero)**
Generate 2 additional variants per platform using GPT-4o:
- Variant A: different angle (e.g., problem-focused instead of benefit-focused)
- Variant B: different tone (e.g., more urgent, or more casual)
- These are NEVER cached (must be unique for A/B testing)

**Step 4.4: Validation**
After generation, validate ALL copy against platform character limits:
```typescript
function validateCopy(copy: AdCopy, platform: Platform): ValidationResult {
  const limits = PLATFORM_LIMITS[platform]
  const errors = []
  if (copy.headline.length > limits.headline) errors.push(`Headline ${copy.headline.length}/${limits.headline}`)
  if (copy.bodyCopy.length > limits.body) errors.push(`Body ${copy.bodyCopy.length}/${limits.body}`)
  return { valid: errors.length === 0, errors }
}
```
If validation fails: retry generation with explicit constraint in prompt: "CRITICAL: headline must be under {limit} characters. Current: {length}. Shorten it."
Max 2 retries. If still fails: truncate with "..." and log warning.

**Step 4.5: Cache hero copy**
```typescript
await redis.setex(cacheKey, 3600, JSON.stringify(heroCopy))  // 1 hour TTL
```

### Chat display
Render `CopyPreviewCard` component immediately (before images):
- Tab buttons per platform
- Headline (bold), body copy, CTA (pill badge)
- Character count per field
- "Genererar bilder..." shimmer below

### Timing
- Hero copy: ~2-3 seconds (Claude Sonnet)
- Variants: ~1-2 seconds (GPT-4o, parallel)
- Total: ~3 seconds (user sees copy immediately)

### Exit condition
Copy generated for all selected platforms, validated against character limits.

---

## Stage 5: Creative assembly

### Trigger
Copy generation complete from Stage 4.

### Execution

**Step 5.1: Check for pre-rendered previews**
```typescript
const previews = await db.select().from(brandTemplatePreviews)
  .where(eq(brandTemplatePreviews.brandProfileId, brandProfileId))
```
If previews exist from the background pre-render (Stage 3): show them IMMEDIATELY while final creatives render.

**Step 5.2: Template selection**
```typescript
// First: try vector-based recommendation (data flywheel)
const recommended = await recommendTemplates(brandProfile, platform, objective)

// If <3 results: fall back to rule-based selection
if (recommended.length < 3) {
  const templates = await getTemplatesByCategory(platform, brandProfile.industry)
}
```

Rule-based template selection:
| Industry | Meta template | Google template | LinkedIn template |
|----------|--------------|-----------------|-------------------|
| SaaS | "minimal" | "standard" | "corporate" |
| E-commerce | "split" | "extended" | "insight" |
| Services | "minimal" | "standard" | "insight" |
| Default | "minimal" | "standard" | "corporate" |

**Step 5.3: Creative rendering (three levels)**

Determine level based on user's plan:

```typescript
type CreativeLevel = 'template' | 'ai_image' | 'ai_video'

function getCreativeLevel(plan: Plan, featureFlags: Flags): CreativeLevel[] {
  const levels: CreativeLevel[] = ['template']  // Always available
  if ((plan === 'pro' || plan === 'agency') && featureFlags.enable_ai_images) {
    levels.push('ai_image')
  }
  if (plan === 'agency' && featureFlags.enable_video) {
    levels.push('ai_video')
  }
  return levels
}
```

**Level 1: Template rendering (ALL plans)**
```typescript
async function renderTemplate(template: AdTemplate, brand: BrandProfile, copy: AdCopy): Promise<string> {
  // 1. Inject brand variables into HTML template
  const html = template.htmlTemplate
    .replace('{{PRIMARY_COLOR}}', brand.colors.primary)
    .replace('{{SECONDARY_COLOR}}', brand.colors.secondary)
    .replace('{{ACCENT_COLOR}}', brand.colors.accent)
    .replace('{{LOGO_URL}}', brand.logos.primary)
    .replace('{{HEADLINE}}', copy.headline)
    .replace('{{BODY}}', copy.bodyCopy)
    .replace('{{CTA}}', copy.cta)
    .replace('{{BRAND_NAME}}', brand.name)

  // 2. Render to PNG via Satori
  const svg = await satori(html, { width: PLATFORM_SIZES[template.format].width, height: PLATFORM_SIZES[template.format].height })
  const png = await renderSvgToPng(svg)

  // 3. Upload to R2
  const url = await uploadToR2(`creatives/${orgId}/${campaignId}/${template.id}.png`, png)
  return url
}
```

Platform sizes:
```typescript
const PLATFORM_SIZES = {
  meta_feed: { width: 1080, height: 1080 },
  meta_story: { width: 1080, height: 1920 },
  google_display: { width: 1200, height: 628 },
  linkedin_sponsored: { width: 1200, height: 627 },
}
```

**Level 2: AI image generation (Pro + Agency)**
```typescript
async function generateAiImage(brand: BrandProfile, copy: AdCopy, type: string): Promise<string> {
  // Route to best model based on content type
  if (type === 'text_banner') {
    // Ideogram 3.0 — best text-in-image rendering
    return await ideogram.generate({ prompt: buildImagePrompt(brand, copy), style: 'design' })
  }
  if (type === 'product_lifestyle') {
    // GPT-4o — best product-in-context
    return await openai.images.generate({ prompt: buildImagePrompt(brand, copy), model: 'gpt-4o' })
  }
  if (type === 'photorealistic') {
    // Flux 1.1 Pro — highest fidelity
    return await flux.generate({ prompt: buildImagePrompt(brand, copy) })
  }
}
```

**Level 3: AI video generation (Agency / credits)**
```typescript
async function generateAiVideo(brand: BrandProfile, copy: AdCopy): Promise<string> {
  // Creatify — URL-to-video
  const video = await creatify.generate({
    url: brand.url,
    script: copy.bodyCopy,
    duration: 15,  // seconds
    style: 'professional'
  })
  // Upload to R2
  return await uploadToR2(`creatives/${orgId}/${campaignId}/video.mp4`, video)
}
```
Cost: $1-3 per 15-sec clip. Gate behind feature flag `enable_video`.

**Step 5.4: Save creatives to database**
```typescript
for (const creative of generatedCreatives) {
  await db.insert(adCreatives).values({
    campaign_id: campaignId,
    org_id: orgId,
    template_id: creative.templateId,
    type: creative.type,           // 'image' | 'video' | 'text_only'
    format: creative.format,       // 'meta_feed' | 'google_search' | 'linkedin_sponsored'
    platform: creative.platform,
    headline: creative.copy.headline,
    body_copy: creative.copy.bodyCopy,
    cta: creative.copy.cta,
    image_url: creative.imageUrl,
    video_url: creative.videoUrl,
    variant_label: creative.variant, // 'hero' | 'variant_a' | 'variant_b'
    original_copy: creative.copy,    // Store original for reset
  })
}
```

### Chat display
Replace the CopyPreviewCard with full `AdPreviewTabs`:
- Tab buttons: "Meta / Instagram", "Google Search", "LinkedIn"
- Each tab shows the ad in that platform's native format
- Lazy-load each preview component (React.lazy + Suspense)
- If image still rendering: show shimmer skeleton in image area, fade in when ready
- Action buttons below: "✏️ Redigera text", "🎨 Ändra stil", "📐 Annat format", "🚀 Publicera"

### Exit condition
At least one creative per selected platform rendered and displayed.

---

## Stage 6: Review & editing

### Trigger
Ad previews displayed in Stage 5.

### Three review paths

**Path A: Side-by-side comparison (default for 2+ variants)**
- Show two variants side by side (desktop) or swipeable stack (mobile)
- "Pick this one" button on each
- Picking one: winner gets green border + "Vald ✓", loser fades to 60%
- After picking for all platforms: suggestion chip "Alla valda — publicera!"

**Path B: Inline editing**
User clicks directly on headline/body/CTA text in the ad preview:
1. Text transforms to inline input (same font, same position)
2. Character count shown: "23/40"
3. Enter saves, Escape cancels
4. On save:
   - Update `ad_creatives` row with new text
   - If text change affects image (headline in template): trigger Inngest background re-render
   - Show green checkmark animation on the edited field
   - Store original in `ad_creatives.original_copy` for reset option

**Path C: Chat-based editing**
User types natural language instructions:
- "Gör rubriken kortare" → Copywriter agent regenerates headline only (GPT-4o for speed)
- "Mer professionell ton" → Regenerate all copy with tone constraint
- "Prova en annan mall" → Creative director selects different template, re-renders
- "Lägg till en emoji" → Update copy with emoji added

For all editing paths:
- Only regenerate what changed (not the entire creative)
- Use GPT-4o for regeneration (faster, cache bypass)
- Log edit type to PostHog for product analytics

### Suggestion chips shown during review
```typescript
["Ser bra ut — publicera!", "Gör rubriken kortare", "Prova en annan mall", "Mer professionell ton", "Ändra CTA"]
```

### Exit condition
User approves creatives (explicitly says "publicera" or clicks publish chip).

---

## Stage 7: Campaign deployment

### Trigger
User approves creatives from Stage 6.

### Pre-deployment: Budget and targeting

**Step 7.1: Budget estimator**
Show `BudgetEstimator` component inline:
- Daily budget slider: 100 kr – 10,000 kr
- Duration: 7 / 14 / 30 days / ongoing
- Estimated results based on industry benchmarks:
  ```typescript
  const estimates = {
    impressions: { min: budget / avgCPM * 1000 * 0.7, max: budget / avgCPM * 1000 * 1.3 },
    clicks: { min: impressions.min * avgCTR, max: impressions.max * avgCTR },
    costPerClick: { min: avgCPC * 0.8, max: avgCPC * 1.2 }
  }
  ```
- User confirms budget → proceed

**Step 7.2: Platform account verification**

```typescript
for (const platform of selectedPlatforms) {
  const account = await db.select().from(adAccounts)
    .where(and(eq(adAccounts.orgId, orgId), eq(adAccounts.platform, platform)))
    .limit(1)

  if (!account || account.status !== 'active') {
    switch (platform) {
      case 'meta':
        // Auto-create under our Business Manager
        await createMetaAdAccount(orgId, brandProfile.name)
        break
      case 'google':
        // Auto-create under our MCC
        await createGoogleClientAccount(orgId, brandProfile.name)
        break
      case 'linkedin':
        // Cannot auto-create — must OAuth
        // Show "Connect LinkedIn" button in chat
        // PAUSE deployment for this platform until OAuth completes
        break
    }
  }
}
```

### Deployment execution (PARALLEL via Inngest fan-out)

```typescript
// Emit single event that fans out to all platforms
await inngest.send({
  name: 'campaign/deploy',
  data: { campaignId, platforms: selectedPlatforms, budget, targeting }
})
```

Inngest function:
```typescript
inngest.createFunction(
  { id: 'campaign-deploy', retries: 3 },
  { event: 'campaign/deploy' },
  async ({ event, step }) => {
    const { campaignId, platforms, budget, targeting } = event.data

    // Fan out: deploy all platforms in parallel
    const results = await Promise.allSettled(
      platforms.map(platform =>
        step.run(`deploy-${platform}`, async () => {
          // Idempotency check
          const deployKey = `deploy:${campaignId}:${platform}:${new Date().toISOString().split('T')[0]}`
          const existing = await db.select().from(deployments)
            .where(eq(deployments.idempotencyKey, deployKey)).limit(1)

          if (existing[0]?.status === 'success') return existing[0] // Already deployed

          // Record deployment attempt
          const [deployment] = await db.insert(deployments).values({
            idempotencyKey: deployKey,
            campaignId,
            platform,
            status: 'pending'
          }).returning()

          try {
            const adapter = getPlatformAdapter(platform)
            const result = await adapter.createCampaign({
              name: campaign.name,
              objective: mapObjective(campaign.objective, platform),
              budget: { daily: budget.daily, currency: budget.currency },
              targeting,
              adAccountId: adAccount.platformAccountId
            })

            // Upload creatives
            const creatives = await db.select().from(adCreatives)
              .where(and(
                eq(adCreatives.campaignId, campaignId),
                eq(adCreatives.platform, platform),
                eq(adCreatives.isSelected, true)
              ))

            for (const creative of creatives) {
              await adapter.uploadCreative({ imageUrl: creative.imageUrl, ... })
              await adapter.createAd({ campaignId: result.campaignId, creative, ... })
            }

            // Mark success
            await db.update(deployments)
              .set({ status: 'success', platformCampaignId: result.campaignId, completedAt: new Date() })
              .where(eq(deployments.id, deployment.id))

            return result
          } catch (error) {
            await db.update(deployments)
              .set({ status: 'failed', error: error.message })
              .where(eq(deployments.id, deployment.id))
            throw error  // Let Inngest retry
          }
        })
      )
    )

    // Update campaign with results
    await step.run('update-campaign-status', async () => {
      const allSuccess = results.every(r => r.status === 'fulfilled')
      const allFailed = results.every(r => r.status === 'rejected')

      await db.update(campaigns).set({
        status: allSuccess ? 'live' : allFailed ? 'failed' : 'partially_live',
        platform_campaign_ids: Object.fromEntries(
          platforms.map((p, i) => [p, results[i].status === 'fulfilled' ? results[i].value.campaignId : null])
        )
      }).where(eq(campaigns.id, campaignId))
    })
  }
)
```

### Platform-specific deployment details

**Meta Marketing API:**
1. Create Campaign: `POST /act_{id}/campaigns` with objective mapping
2. Create AdSet: `POST /act_{id}/adsets` with targeting, budget, schedule
3. Upload Image: `POST /act_{id}/adimages`
4. Create Ad: `POST /act_{id}/ads` with creative spec
- Auth: System User Token (never expires)
- Rate limit: 9,000 points per 300 seconds per ad account
- Account creation: under our Business Manager (customer never sees this)

**Google Ads API:**
1. Create Campaign: `CustomerService.CreateCustomerClient` (creates account under MCC)
2. Create AdGroup: standard API call
3. Create ResponsiveSearchAd: 3 headlines + 2 descriptions
4. Set keywords (auto-generated from brand profile value propositions)
- Auth: OAuth 2.0 with developer token
- Rate limit: 15,000 ops/day (Basic tier)
- Account creation: `CreateCustomerClient` under MCC (customer never sees this)

**LinkedIn Campaign Manager API:**
1. Create CampaignGroup
2. Create Campaign with targeting (job titles, industries, company size)
3. Upload image via `/assets`
4. Create Creative (sponsored content)
- Auth: 3-legged OAuth (customer MUST log in)
- Token expiry: 60 days (refresh 14 days before via background job)
- NO account creation — customer must have Campaign Manager account

### Chat display during deployment
`CampaignDeploymentStatus` component with real-time updates via Supabase Realtime:
```
Meta         ✅ Live
Google       ⏳ Deploying... (3s)
LinkedIn     🔗 Connect required
```

Optimistic UI: show "Deploying..." immediately on click, reconcile with real status via Supabase Realtime subscription:
```typescript
supabase.channel('campaign-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'campaigns',
    filter: `id=eq.${campaignId}`
  }, (payload) => updateStatus(payload.new))
  .subscribe()
```

### Handling partial deployment
If Meta succeeds but Google fails:
1. Campaign status = "partially_live"
2. Show per-platform status in chat
3. "Retry" button only on failed platforms
4. Retry triggers deployment for ONLY that platform (successful ones untouched)

### Exit condition
At least one platform successfully deployed. Campaign status is 'live' or 'partially_live'.

---

## Stage 8: Live & optimization

### Trigger
Campaign deployed successfully.

### Immediate post-deployment
AI confirms in chat: "Dina kampanjer är live! 🎉 Meta och Google är igång. Jag håller koll på prestandan och meddelar dig om något behöver justeras."

### Automated optimization loop (runs continuously, no user input required)

**Step 8.1: Performance polling (Inngest cron, every 6 hours)**
```typescript
inngest.createFunction(
  { id: 'analytics-poll-metrics' },
  { cron: '0 */6 * * *' },  // Every 6 hours
  async ({ step }) => {
    const activeAccounts = await db.select().from(adAccounts)
      .where(eq(adAccounts.status, 'active'))

    for (const account of activeAccounts) {
      await step.run(`poll-${account.platform}-${account.id}`, async () => {
        const adapter = getPlatformAdapter(account.platform)
        const campaigns = await adapter.getCampaignInsights(account.platformAccountId, {
          since: subDays(new Date(), 1),
          until: new Date()
        })

        for (const campaign of campaigns) {
          await db.insert(creativePerformance).values({
            creative_id: matchCreative(campaign.adId),
            org_id: account.orgId,
            platform: account.platform,
            date: new Date(),
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            conversions: campaign.conversions,
            spend: campaign.spend,
            ctr: campaign.clicks / campaign.impressions,
            cpc: campaign.spend / campaign.clicks,
            roas: campaign.conversionValue / campaign.spend,
          })
        }
      })
    }
  }
)
```

**Step 8.2: Optimizer agent (runs after each poll)**
```typescript
inngest.createFunction(
  { id: 'optimizer-analyze' },
  { event: 'analytics/poll-complete' },
  async ({ event, step }) => {
    const { orgId } = event.data

    const performance = await getRecentPerformance(orgId, 7) // Last 7 days
    const benchmarks = await getIndustryBenchmarks(orgId)

    const analysis = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt: `
        Analyze this campaign performance data and generate specific recommendations.
        
        Performance: ${JSON.stringify(performance)}
        Industry benchmarks: ${JSON.stringify(benchmarks)}
        
        For each campaign, determine:
        1. Is CTR above or below benchmark? By how much?
        2. Is CPC above or below benchmark?
        3. Which creative variant is performing best?
        4. Should any ads be paused (CTR < 50% of benchmark)?
        5. Should budget be shifted to higher performers?
        
        Return JSON array of recommendations: { type, campaignId, action, reason, confidence }
      `
    })

    // Store recommendations
    await db.insert(optimizerRecommendations).values(analysis.recommendations)

    // For Pro users with auto-optimize enabled: execute automatically
    if (org.plan === 'pro' && org.metadata.autoOptimize) {
      for (const rec of analysis.recommendations.filter(r => r.confidence > 0.8)) {
        await executeRecommendation(rec) // Pause/adjust via platform APIs
      }
    }
  }
)
```

**Step 8.3: Weekly digest email (Inngest cron, Monday 9am)**
```typescript
inngest.createFunction(
  { id: 'analytics-weekly-digest' },
  { cron: '0 9 * * 1' },  // Monday 9am
  async ({ step }) => {
    const orgsWithActiveCampaigns = await getOrgsWithActiveCampaigns()

    for (const org of orgsWithActiveCampaigns) {
      const weeklyData = await getWeeklyPerformance(org.id)
      const recommendations = await getUnactedRecommendations(org.id)

      await resend.emails.send({
        from: 'Doost AI <reports@doost.ai>',
        to: org.email,
        subject: `Veckorapport: ${weeklyData.totalImpressions.toLocaleString()} visningar denna vecka`,
        react: WeeklyDigestEmail({ weeklyData, recommendations })
      })
    }
  }
)
```

**Step 8.4: Embedding index update (data flywheel)**
```typescript
inngest.createFunction(
  { id: 'embeddings-update' },
  { cron: '0 2 * * *' },  // Nightly at 2am
  async ({ step }) => {
    // Find high-performing creatives without embeddings
    const creatives = await db.select().from(adCreatives)
      .where(and(
        isNull(adCreatives.embedding),
        gt(adCreatives.performanceScore, 50) // Above median
      ))

    for (const creative of creatives) {
      await step.run(`embed-${creative.id}`, async () => {
        const embedding = await generateCreativeEmbedding({
          industry: creative.brand.industry,
          platform: creative.platform,
          headline: creative.headline,
          bodyCopy: creative.bodyCopy,
          templateId: creative.templateId,
          brandVoice: creative.brand.brandVoice,
          objective: creative.campaign.objective,
        })

        await db.update(adCreatives)
          .set({ embedding })
          .where(eq(adCreatives.id, creative.id))
      })
    }
  }
)
```

### User-initiated queries in chat
User can ask about performance at any time:

"Hur går mina annonser?" → `get_performance` tool:
1. Fetch latest metrics from `creative_performance` table
2. Compare against benchmarks
3. AI summarizes: "Din Meta-kampanj har 3.2% CTR — 60% över branschsnittet. Variant A presterar 2x bättre än Variant B. Jag rekommenderar att pausa Variant B och flytta budgeten."

"Pausa alla kampanjer" → `pause_campaigns` tool:
1. For each active campaign: call `adapter.pauseCampaign()`
2. Update campaign status to 'paused'
3. Confirm: "Alla kampanjer pausade."

"Skapa ny kampanj" → Restart from Stage 4 with existing brand profile.

### Background jobs summary

| Job | Schedule | Purpose |
|-----|----------|---------|
| `analytics/poll-metrics` | Every 6 hours | Fetch performance data from all platforms |
| `optimizer/analyze` | After each poll | AI analyzes and recommends |
| `analytics/weekly-digest` | Monday 9am | Email performance summary |
| `embeddings/update` | Nightly 2am | Update vector index for data flywheel |
| `tokens/refresh-meta` | Daily | Refresh Meta tokens expiring within 7 days |
| `tokens/refresh-linkedin` | Daily | Refresh LinkedIn tokens expiring within 14 days |
| `brand/retry-enrichment` | On failure | Retry failed Roaring.io/Clearbit calls |
| `creatives/pre-render` | On profile create | Pre-render template previews |
| `deployments/cleanup` | Weekly | Delete old deployment records |

### Exit condition
This stage runs indefinitely while campaigns are active. The optimization loop compounds over time — every campaign makes the system smarter for the next one.

---

## Token management (critical background system)

### Encryption
All OAuth tokens encrypted via envelope encryption:
```
User token → AES-256-GCM with data key → encrypted token stored in DB
Data key → encrypted by AWS KMS master key → stored alongside token
```
Each org gets unique encryption context: `{ orgId: 'uuid' }`

### Token lifecycle per platform

**Meta:**
- System User Tokens: never expire (preferred for server-to-server)
- User Access Tokens: 60-day expiry, extend via token exchange
- Refresh: background job checks daily, refreshes tokens expiring within 7 days

**Google:**
- Refresh Tokens: never expire (unless user revokes)
- Access Tokens: 1-hour expiry, auto-refresh via SDK
- Refresh: handled automatically by Google client library

**LinkedIn:**
- Access Tokens: 60-day expiry
- Refresh Tokens: 12-month expiry
- Refresh: background job checks daily, refreshes tokens expiring within 14 days
- If refresh fails: mark account as 'disconnected', notify user in next chat session

### Token refresh failure handling
```typescript
if (refreshFailed) {
  await db.update(adAccounts)
    .set({ status: 'disconnected' })
    .where(eq(adAccounts.id, accountId))

  // Notify user
  await db.insert(notifications).values({
    orgId: account.orgId,
    type: 'token_expired',
    message: `Din ${platform}-anslutning har gått ut. Logga in igen för att fortsätta köra annonser.`,
    actionUrl: `/settings/platforms`
  })

  // Pause affected campaigns
  const campaigns = await getActiveCampaignsForAccount(accountId)
  for (const campaign of campaigns) {
    await transitionCampaign(campaign.id, { type: 'PAUSE', payload: { reason: 'token_expired' } })
  }
}
```

---

## Error handling philosophy

1. **Scraping fails** → Pipeline stops. Show clear error. User can retry.
2. **Enrichment fails** → Pipeline continues. Retry in background.
3. **Copy generation fails** → Fallback chain: Sonnet → GPT-4o → Haiku. If all fail: show error.
4. **Image rendering fails** → Show copy-only preview. Retry render in background.
5. **Single platform deploy fails** → Other platforms unaffected. Show per-platform status. Offer retry.
6. **All platforms fail** → Campaign status "failed". Show clear error with retry button.
7. **Token expired** → Pause affected campaigns. Notify user. Don't lose data.
8. **Rate limited** → Inngest handles retry with exponential backoff. User sees "deploying..." longer.
9. **LLM returns bad output** → Validate, retry with stricter prompt, max 2 retries.

Rule: NEVER lose user data. NEVER double-deploy. ALWAYS show clear status.

---

## Model routing rules

```typescript
function routeModel(context: {
  intent: string
  tokenCount: number
  isRegeneration: boolean
}): { provider: string, model: string } {

  // Short chat messages (<50 tokens, no tools) → Haiku (cheapest, fastest)
  if (context.intent === 'chat' && context.tokenCount < 50) {
    return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }
  }

  // Hero copy generation → Sonnet (highest quality)
  if (context.intent === 'copy_generation' && !context.isRegeneration) {
    return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' }
  }

  // Regeneration / variants → GPT-4o (fast, good compliance)
  if (context.intent === 'copy_variant' || context.isRegeneration) {
    return { provider: 'openai', model: 'gpt-4o' }
  }

  // Brand profile assembly → Haiku (structured output, low creativity)
  if (context.intent === 'profile_assembly') {
    return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }
  }

  // Performance analysis → Haiku (structured, data-focused)
  if (context.intent === 'optimization') {
    return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }
  }

  // Default → Sonnet
  return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' }
}
```

---

## Feature flag gates

These features are gated behind PostHog feature flags. Check before enabling:

```typescript
const FLAGS = {
  enable_ai_images: false,        // Level 2 creatives (Ideogram, GPT-4o images)
  enable_video: false,             // Level 3 creatives (Creatify, HeyGen)
  enable_linkedin: false,          // LinkedIn integration (pending API approval)
  enable_optimizer_v2: false,      // Auto-execute optimization recommendations
  enable_budget_estimator: false,  // Budget calculator before deploy
  enable_variant_comparison: false,// Side-by-side variant picker
  enable_inline_editing: false,    // Click-to-edit on ad previews
  enable_dark_mode: false,         // Dark mode toggle
  enable_command_palette: false,   // Cmd+K
}
```

Rollout schedule per flag: internal → 5% → 25% → 50% → 100% over 2 weeks each.

---

## This is the complete pipeline. Build it exactly as specified.
