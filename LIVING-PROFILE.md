# LIVING-PROFILE.md — The Doost AI Customer Intelligence System

> This is the most important document in the project.
> It defines how we UNDERSTAND our customers — not just collect data.
>
> The difference between a good product and a category-defining one
> is whether the customer feels understood. Not surveyed. Understood.
>
> Every interaction teaches us something. Every campaign result
> sharpens our understanding. Over time, Doost knows the customer's
> business better than they do. That's the moat.

---

## The core idea

Most marketing tools ask: "What do you want to advertise?"
Doost asks: "Let me look at your business and tell you what to do."

The customer profile is not a form. Not a database row. Not a kundkort.
It is a **continuously learning model of the customer's business**.

Day 1: We know their colors and employee count.
Day 30: We know which messages resonate with their audience.
Day 90: We know their customer acquisition cost, best-performing channels, and seasonal patterns.
Day 365: We know more about their marketing than their CMO does.

That is the product.

---

## The three layers of understanding

### Layer 1: Who they are (static — collected once, updated rarely)

This is what we extract from the URL + enrichment on day 1.
It changes slowly — maybe the company rebrands, hires more people, or pivots.
We re-check quarterly.

```
Identity
├── Company name, URL, org number
├── Industry, SNI codes
├── Location, employee count, revenue
├── Founded year, CEO, board
└── Legal form (AB, HB, etc.)

Brand
├── Colors (primary, secondary, accent)
├── Fonts (heading, body)
├── Logo (multiple variants)
├── Tone of voice (formality, warmth, urgency scores)
└── Core messaging (tagline, value props, differentiators)

Digital presence
├── Social accounts (FB, IG, LI, YT, TikTok)
├── Google Business Profile + reviews
├── Website speed + mobile score
├── Tracking pixels installed
└── Tech stack
```

### Layer 2: What they want (evolving — learned from behavior + conversations)

This layer is built from every interaction. Not from questions — from observation.

```
Goals
├── Primary objective (awareness/traffic/leads/conversions)
├── Current pain points (mentioned in chat)
├── Growth stage (startup/scaleup/established — inferred from revenue + team size)
├── Budget comfort level (from selections + spending patterns)
└── Urgency level (how fast they move from profile to campaign)

Audience understanding
├── Who their customer is (inferred from website + confirmed by user)
├── Geographic focus (from targeting selections)
├── B2B vs B2C (inferred from multiple signals)
├── Decision makers they target (job titles, seniority)
├── Buying cycle length (short/long — from industry + product type)
└── Pain points their customers have (from website copy analysis)

Preferences
├── Preferred platforms (which channels they choose most)
├── Preferred ad format (image vs video vs text)
├── Copy style preferences (which variants they pick in A/B comparisons)
├── Visual style preferences (which templates they select)
├── Response time preferences (do they edit a lot or approve fast?)
├── Language preferences (Swedish or English ads?)
└── Level of control (hands-off vs hands-on)
```

### Layer 3: What works for them (dynamic — learned from campaign performance)

This is the layer no competitor has. It only exists because we run their campaigns and see the results.

```
Performance patterns
├── Best-performing platform (by ROAS, CTR, CPC)
├── Best-performing ad format (image outperforms video? vice versa?)
├── Best-performing copy angle (benefit vs problem vs social proof)
├── Best-performing CTA (Boka demo vs Läs mer vs Kom igång)
├── Best time of day for engagement
├── Best day of week for conversions
├── Audience segments that convert best
├── Geographic regions that convert best
└── Seasonal patterns (do they have peaks?)

Creative DNA
├── Color combinations that get highest CTR
├── Headline structures that work ("How [company] does X" vs "X% faster Y")
├── Body copy length that converts (short punchy vs detailed)
├── Image styles that engage (people vs abstract vs product)
├── CTA buttons that get clicks (text, color, placement)
└── Templates that perform best for THIS specific company

Budget intelligence
├── Optimal daily budget (where diminishing returns start)
├── Budget allocation by platform (60% Meta, 30% Google, 10% LinkedIn)
├── Cost per acquisition trend (improving, stable, worsening)
├── Lifetime value of acquired customers (if conversion tracking is set up)
└── Break-even timeline (how long until ads pay for themselves)
```

---

## How we learn WITHOUT asking

The magic is that most of Layer 2 and all of Layer 3 are learned passively.
The customer never fills out a form. They just use the product.

### Signal: Chat behavior reveals preferences

```typescript
interface ChatBehaviorSignals {
  // How they interact with ads
  approvalSpeed: number            // Seconds from seeing ad to approving
  editFrequency: number            // How often they edit AI-generated copy
  editTypes: string[]              // What they change: "headline", "cta", "body"
  regenerateCount: number          // How often they ask for new variants
  
  // What they change tells us their taste
  // If they always make headlines shorter → they prefer punchy copy
  // If they always add emojis → they want casual tone
  // If they never edit → they trust AI or don't care about details
  
  headlineLengthPreference: 'shorter' | 'same' | 'longer'
  toneAdjustments: string[]        // "more professional", "more casual", "more urgent"
  
  // How they make decisions
  platformPreference: string[]     // Which platform tab they click first
  timeToDecision: number           // Average seconds to approve/edit
  sessionLength: number            // How long they spend per visit
  returnFrequency: number          // How often they come back (daily/weekly/monthly)
  
  // What they ask about
  topicInterests: string[]         // "analytics", "competitor", "budget", "creative"
  questionTypes: string[]          // "how to", "why", "compare", "recommend"
}
```

```typescript
// We track these signals silently. No tracking popup. No consent form.
// This is first-party behavioral data within our own product.
// GDPR-compliant because it's legitimate interest for service improvement.

function learnFromChatBehavior(messages: Message[], creativeEdits: Edit[]): BehaviorProfile {
  
  // Analyze edit patterns
  const edits = creativeEdits.map(edit => ({
    field: edit.field,
    original: edit.originalText,
    modified: edit.modifiedText,
    lengthChange: edit.modifiedText.length - edit.originalText.length,
    sentimentChange: analyzeSentiment(edit.modifiedText) - analyzeSentiment(edit.originalText),
  }))
  
  // Derive preferences
  const avgLengthChange = average(edits.map(e => e.lengthChange))
  const headlinePreference = avgLengthChange < -5 ? 'shorter' : avgLengthChange > 5 ? 'longer' : 'same'
  
  // Track which platform they engage with most
  const platformClicks = messages
    .filter(m => m.role === 'user')
    .map(m => detectPlatformMention(m.content))
    .filter(Boolean)
  
  // Track approval speed (fast approvers = trust AI, slow = want control)
  const approvalEvents = getApprovalTimings(messages)
  const avgApprovalTime = average(approvalEvents.map(e => e.durationSeconds))
  const controlLevel = avgApprovalTime < 30 ? 'hands-off' : avgApprovalTime < 120 ? 'moderate' : 'hands-on'
  
  return {
    headlinePreference,
    controlLevel,
    preferredPlatforms: mostCommon(platformClicks),
    copyTone: deriveTonePreference(edits),
    ...
  }
}
```

### Signal: Campaign results reveal what works

```typescript
// After every performance poll (every 6 hours), we update the customer's
// performance profile. This is the most valuable data in the system.

async function updatePerformanceProfile(orgId: string) {
  const last90Days = await getCreativePerformance(orgId, 90)
  
  // Find their best content patterns
  const topPerformers = last90Days
    .filter(c => c.ctr > getMedianCTR(c.platform, c.industry))
    .sort((a, b) => b.roas - a.roas)
  
  const bottomPerformers = last90Days
    .filter(c => c.ctr < getMedianCTR(c.platform, c.industry) * 0.5)
  
  // Analyze what the winners have in common
  const winningPatterns = {
    // Copy analysis
    avgHeadlineLength: average(topPerformers.map(c => c.headline.length)),
    commonHeadlineWords: findCommonWords(topPerformers.map(c => c.headline)),
    commonCTAs: findMostCommon(topPerformers.map(c => c.cta)),
    
    // Format analysis
    bestFormat: findMostCommon(topPerformers.map(c => c.format)),
    bestTemplate: findMostCommon(topPerformers.map(c => c.templateId)),
    
    // Timing
    bestDayOfWeek: findBestDay(topPerformers),
    bestTimeOfDay: findBestHour(topPerformers),
    
    // Platform
    bestPlatform: findBestPlatform(topPerformers),
    platformROAS: {
      meta: calculatePlatformROAS(last90Days, 'meta'),
      google: calculatePlatformROAS(last90Days, 'google'),
      linkedin: calculatePlatformROAS(last90Days, 'linkedin'),
    },
    
    // Audience
    bestAgeRange: findBestAgeRange(topPerformers),
    bestGeoRegion: findBestRegion(topPerformers),
  }
  
  // Analyze what losers have in common (what to AVOID)
  const losingPatterns = {
    commonMistakes: findCommonWords(bottomPerformers.map(c => c.headline)),
    worstFormats: findMostCommon(bottomPerformers.map(c => c.format)),
    worstTimes: findWorstDay(bottomPerformers),
  }
  
  // Save to profile
  await db.update(brandProfiles).set({
    performanceProfile: { winningPatterns, losingPatterns, lastUpdated: new Date() }
  }).where(eq(brandProfiles.orgId, orgId))
}
```

### Signal: Industry comparisons reveal position

```typescript
// We know how ALL customers in the same industry perform.
// This means we can tell Customer X exactly where they stand.

async function calculateIndustryPosition(orgId: string): Promise<IndustryPosition> {
  const customer = await getPerformanceProfile(orgId)
  const industry = customer.industry
  
  // Get all customers in same industry (anonymized)
  const industryPeers = await db.select({
    avgCTR: avg(creativePerformance.ctr),
    avgCPC: avg(creativePerformance.cpc),
    avgROAS: avg(creativePerformance.roas),
  })
  .from(creativePerformance)
  .innerJoin(brandProfiles, eq(creativePerformance.orgId, brandProfiles.orgId))
  .where(eq(brandProfiles.industry, industry))
  
  return {
    customerCTR: customer.avgCTR,
    industryCTR: industryPeers.avgCTR,
    percentile: calculatePercentile(customer.avgCTR, industryDistribution),
    
    // "Your CTR is 3.2% — top 15% in B2B SaaS"
    // "Your CPC is 12 kr — 30% lower than industry average"
    // "Your Meta ROAS is 4.1x — you're outperforming 78% of similar companies"
    
    insights: generatePositionInsights(customer, industryPeers),
  }
}
```

---

## The profile lifecycle — how it evolves

### Day 1: First impression

The user pastes their URL. In 15 seconds, they see:
- Brand identity extracted
- Company data enriched
- Social presence mapped
- Competitors identified
- Marketing readiness scored

What the profile knows: who they ARE.
What it doesn't know: what WORKS for them.

**The profile is 30% complete. But the user sees 100% value.**

### Week 1: First campaign

They run their first campaign. We see:
- Which platform they chose (interest signal)
- Which template they picked (visual preference)
- What copy edits they made (tone preference)
- How quickly they approved (control preference)
- First 48 hours of performance data

**Profile is 45% complete. We now know their preferences.**

### Month 1: Pattern recognition

With 4 weeks of campaign data:
- We know their best-performing day of week
- We know which copy angles work (benefit vs problem vs social proof)
- We know which audience segments convert
- We can compare them to industry benchmarks

**Profile is 60% complete. We can make specific recommendations.**

The AI starts being proactive:
```
"Good morning! I noticed your LinkedIn ads perform 2.3x better on Tuesdays.
Your next campaign is set for Monday launch — want me to shift it to Tuesday?"
```

### Month 3: Intelligence mode

With 90 days of data across multiple campaigns:
- We have a clear picture of their Creative DNA
- We know their optimal budget allocation across platforms
- We can predict which new ad will perform well BEFORE running it
- We know their seasonal patterns (if any)

**Profile is 80% complete. We're smarter than their agency.**

The AI does things no human marketer would think of:
```
"I analyzed your top 10 ads. The ones with numbers in the headline
('Halvera tiden', '200+ kunder', '3x snabbare') get 47% higher CTR
than generic headlines. I've updated all future copy generation
to prioritize number-driven headlines for your brand."
```

### Month 6+: Compounding intelligence

At this point, the profile is a proprietary asset:
- Nobody else has this data about this specific customer
- The longer they use Doost, the better it gets
- Switching to another tool means starting from zero
- The AI is effectively a trained marketing specialist for THIS company

**Profile is 90%+ complete. This IS the moat.**

---

## Proactive intelligence — the system that reaches out

The profile isn't passive. It triggers actions when it detects opportunities or problems.

### Trigger system

```typescript
interface ProfileTrigger {
  id: string
  name: string
  condition: (profile: LiveProfile, newData: any) => boolean
  action: (profile: LiveProfile) => Promise<void>
  cooldown: number  // Don't trigger more than once per X days
}

const TRIGGERS: ProfileTrigger[] = [
  
  // ─── Competitor triggers ───
  {
    id: 'competitor_new_campaign',
    name: 'Competitor launched new ads',
    condition: (profile, newAdLibraryData) => {
      const competitor = profile.competitors[0]
      const newAds = newAdLibraryData.filter(ad => 
        ad.page_name === competitor.name && 
        ad.ad_delivery_start_time > subDays(new Date(), 3)
      )
      return newAds.length >= 3  // Competitor launched 3+ new ads recently
    },
    action: async (profile) => {
      // Send notification in chat + email
      await notify(profile.orgId, {
        title: `${profile.competitors[0].name} har lanserat ${newAds.length} nya annonser`,
        body: 'Vill du se deras annonser och uppdatera dina?',
        type: 'competitor_alert',
        priority: 'medium',
      })
    },
    cooldown: 14,  // Max once per 2 weeks per competitor
  },
  
  // ─── Performance triggers ───
  {
    id: 'performance_drop',
    name: 'CTR dropped significantly',
    condition: (profile, latestMetrics) => {
      const last7Days = average(latestMetrics.slice(-7).map(d => d.ctr))
      const previous7Days = average(latestMetrics.slice(-14, -7).map(d => d.ctr))
      return last7Days < previous7Days * 0.7  // 30% drop
    },
    action: async (profile) => {
      // Analyze why and suggest fix
      const analysis = await analyzePerformanceDrop(profile)
      await notify(profile.orgId, {
        title: 'Din CTR har sjunkit 30% senaste veckan',
        body: analysis.reason,
        suggestedAction: analysis.fix,
        type: 'performance_alert',
        priority: 'high',
      })
    },
    cooldown: 7,
  },
  
  // ─── Seasonal triggers ───
  {
    id: 'seasonal_opportunity',
    name: 'Industry seasonal peak approaching',
    condition: (profile) => {
      const peaks = INDUSTRY_SEASONAL_PEAKS[profile.industry]
      if (!peaks) return false
      const nextPeak = peaks.find(p => isWithinDays(p.startDate, 21))
      return !!nextPeak
    },
    action: async (profile) => {
      const peak = getUpcomingPeak(profile.industry)
      await notify(profile.orgId, {
        title: `${peak.name} börjar om ${peak.daysUntil} dagar`,
        body: `Förra året ökade konverteringar i din bransch med ${peak.avgIncrease}% under denna period. Vill du öka budgeten?`,
        type: 'seasonal_opportunity',
        priority: 'medium',
      })
    },
    cooldown: 30,
  },
  
  // ─── Content triggers ───
  {
    id: 'ad_fatigue',
    name: 'Creative fatigue detected',
    condition: (profile, metrics) => {
      // Same creative running 21+ days with declining CTR
      const oldCreatives = profile.activeCreatives.filter(c => 
        daysSince(c.startDate) > 21 &&
        c.ctrTrend === 'declining'
      )
      return oldCreatives.length > 0
    },
    action: async (profile) => {
      // Auto-generate new variants
      const newVariants = await generateFreshCreatives(profile)
      await notify(profile.orgId, {
        title: `${oldCreatives.length} annonser visar tecken på ad fatigue`,
        body: 'Jag har genererat nya varianter. Vill du byta ut dem?',
        suggestedCreatives: newVariants,
        type: 'creative_refresh',
        priority: 'medium',
      })
    },
    cooldown: 14,
  },

  // ─── Review triggers ───
  {
    id: 'new_google_reviews',
    name: 'New Google reviews detected',
    condition: (profile, latestReviews) => {
      return latestReviews.some(r => r.isNew && r.rating >= 4)
    },
    action: async (profile) => {
      await notify(profile.orgId, {
        title: 'Nytt 5-stjärnigt omdöme på Google!',
        body: `"${latestReview.text.slice(0, 80)}..." — Vill du använda det i dina annonser?`,
        type: 'review_opportunity',
        priority: 'low',
      })
    },
    cooldown: 7,
  },
  
  // ─── Growth triggers ───
  {
    id: 'ready_to_scale',
    name: 'Customer is ready for next platform',
    condition: (profile) => {
      // Running one platform successfully for 30+ days with good ROAS
      const activePlatforms = profile.activePlatforms
      const allPlatforms = ['meta', 'google', 'linkedin']
      const unusedPlatforms = allPlatforms.filter(p => !activePlatforms.includes(p))
      
      return (
        unusedPlatforms.length > 0 &&
        profile.avgROAS > 2.0 &&
        profile.daysActive > 30
      )
    },
    action: async (profile) => {
      const nextPlatform = recommendNextPlatform(profile)
      await notify(profile.orgId, {
        title: `Dags att expandera till ${nextPlatform.name}?`,
        body: `Dina ${profile.activePlatforms[0]}-kampanjer ger ${profile.avgROAS}x ROAS. Baserat på din bransch och målgrupp bör ${nextPlatform.name} ge liknande resultat. Vill du testa?`,
        type: 'expansion_opportunity',
        priority: 'medium',
      })
    },
    cooldown: 30,
  },
  
  // ─── Budget triggers ───
  {
    id: 'budget_waste',
    name: 'Budget allocated to underperforming segment',
    condition: (profile, metrics) => {
      // More than 30% of budget going to segments with below-average ROAS
      const wastedBudget = metrics
        .filter(m => m.roas < profile.avgROAS * 0.5)
        .reduce((sum, m) => sum + m.spend, 0)
      const totalBudget = metrics.reduce((sum, m) => sum + m.spend, 0)
      return wastedBudget / totalBudget > 0.3
    },
    action: async (profile) => {
      const reallocation = calculateOptimalBudget(profile)
      await notify(profile.orgId, {
        title: `${Math.round(wastedPercent)}% av din budget går till underpresterande annonser`,
        body: `Jag föreslår att flytta ${reallocation.amount} kr/dag från ${reallocation.from} till ${reallocation.to}. Det bör öka ROAS med ~${reallocation.expectedImprovement}%.`,
        type: 'budget_optimization',
        priority: 'high',
      })
    },
    cooldown: 7,
  },
]
```

### How triggers run

```typescript
// Inngest cron: runs every 6 hours alongside performance polling
inngest.createFunction(
  { id: 'profile-triggers' },
  { cron: '30 */6 * * *' },  // 30 min after performance poll
  async ({ step }) => {
    const activeOrgs = await getOrgsWithActiveCampaigns()
    
    for (const org of activeOrgs) {
      await step.run(`triggers-${org.id}`, async () => {
        const profile = await getFullProfile(org.id)
        const latestData = await getLatestData(org.id)
        
        for (const trigger of TRIGGERS) {
          // Check cooldown
          const lastFired = await getLastTriggerFire(org.id, trigger.id)
          if (lastFired && daysSince(lastFired) < trigger.cooldown) continue
          
          // Check condition
          if (trigger.condition(profile, latestData)) {
            await trigger.action(profile)
            await recordTriggerFire(org.id, trigger.id)
          }
        }
      })
    }
  }
)
```

---

## The profile as the AI's memory

When the customer opens chat, the AI doesn't start from zero. It has full context:

```typescript
function buildAIContext(profile: LiveProfile): string {
  return `
## About this customer

Company: ${profile.identity.name} (${profile.business.industry})
${profile.business.employeeCount} employees, ${profile.business.revenue} revenue
Active customer for ${profile.meta.daysActive} days

## What I know about their preferences

They prefer ${profile.preferences.copyTone} copy tone.
They typically ${profile.preferences.controlLevel === 'hands-off' ? 'approve quickly without editing' : 'carefully review and edit each ad'}.
Their favorite platform is ${profile.preferences.preferredPlatforms[0]}.
They usually pick ${profile.preferences.headlinePreference} headlines.
${profile.preferences.languagePreference === 'sv' ? 'They want ads in Swedish.' : 'They want ads in English.'}

## What works for them

Best performing headline structure: ${profile.performance.winningPatterns.headlineStructure}
Best CTA: "${profile.performance.winningPatterns.bestCTA}"
Best day for campaigns: ${profile.performance.winningPatterns.bestDay}
Their top-performing ad had ${profile.performance.bestEverCTR}% CTR with the headline "${profile.performance.bestEverHeadline}"

## What to avoid

${profile.performance.losingPatterns.commonMistakes.map(m => `- Don't: ${m}`).join('\n')}

## Current status

Active campaigns: ${profile.campaigns.active.length}
Total spend this month: ${profile.campaigns.monthlySpend} kr
Overall ROAS: ${profile.campaigns.avgROAS}x
Industry percentile: Top ${profile.industryPosition.percentile}%

## Recent events

${profile.recentEvents.map(e => `- ${e.date}: ${e.description}`).join('\n')}

## Pending recommendations

${profile.pendingRecommendations.map(r => `- ${r.priority}: ${r.title}`).join('\n')}

## Instructions

Use this knowledge naturally. Don't say "based on your profile data" — 
just know it, like a colleague who has worked with them for months.
If they ask for a new campaign, use their winning patterns.
If their performance is dropping, mention it proactively.
Speak Swedish unless they use English.
Match their tone: ${profile.preferences.copyTone}.
`
}
```

This context is injected into EVERY chat message. The AI feels like it knows them.

### Example interactions showing deep understanding

**Day 1 (new customer):**
```
User: "planacy.com"
AI: "Jag har analyserat Planacy. Ni är ett FP&A-verktyg för tillväxtbolag i 
     Stockholm med 45 anställda. Er starkaste USP verkar vara automatiserad 
     budgetering — era konkurrenter fokuserar mest på rapportering. 
     Det är en intressant differentiering vi bör lyfta i annonserna."
```

**Day 30 (learning their taste):**
```
User: "Ny kampanj"
AI: "Ska göra! Jag vet att du gillar korta, punchiga rubriker och att 
     'Boka demo' fungerar bättre än 'Läs mer' som CTA för er. Ska jag 
     köra samma stil? Eller vill du testa något nytt?"
```

**Day 90 (deep understanding):**
```
User: "Hur ser det ut?"
AI: "Stark vecka! Tre saker att veta:

     1. Er LinkedIn-kampanj har 4.1x ROAS — ni är i topp 12% bland 
        B2B SaaS i Norden. Rubriken 'Halvera budgeteringstiden' 
        drar bäst.
     
     2. Meta-kampanjen tappar lite — CTR ner 15% senaste veckan. 
        Annonserna har kört i 24 dagar. Jag har tagit fram 3 nya 
        varianter med nummer-rubriker (som funkar bäst för er).
        Vill du byta ut?
     
     3. Boardeaser (er konkurrent) startade sin första 
        Google Ads-kampanj igår. Ska jag analysera den?"
```

**Day 180 (marketing partner):**
```
AI: "God morgon! Tre saker inför veckan:

     1. Budget Q4 brukar vara er starkaste period — förra årets 
        data visar 40% fler demo-bokningar i november. Jag föreslår 
        att öka budgeten med 50% från och med nästa vecka.
     
     2. Ni fick ett nytt 5-stjärnigt omdöme på Google igår: 
        'Planacy har halverat vår rapporteringstid.' Ska jag 
        lägga in det i era annonser?
     
     3. Er bransch har en genomsnittlig CAC på 8,200 kr. 
        Ni ligger på 4,100 kr. Det bör vara en del av ert 
        säljargument — ska jag skapa en annons som lyfter det?"
```

---

## The profile network effect — how customers make each other better

The individual profile is powerful. The network of profiles is transformative.

### Cross-customer learning

```typescript
// When we learn what works for one B2B SaaS company,
// we can apply those insights to ALL B2B SaaS companies.

interface IndustryIntelligence {
  industry: string
  sampleSize: number           // How many companies we have data for
  
  // Aggregated winning patterns (anonymized)
  bestPractices: {
    topHeadlineStructures: string[]    // "Number + benefit" works 47% better
    topCTAs: string[]                  // "Boka demo" beats "Läs mer" by 2.3x
    optimalHeadlineLength: number      // 28-35 characters
    optimalBodyLength: number          // 80-100 characters
    bestPlatformByObjective: Record<string, string>
    bestDayOfWeek: string
    bestTimeOfDay: string
    avgCAC: number
    avgROAS: number
    avgCTR: Record<string, number>     // Per platform
  }
  
  // Seasonal patterns across the industry
  seasonalPatterns: Array<{
    period: string                     // "Q4", "January", "Summer"
    effect: string                     // "40% increase in demo requests"
    recommendation: string             // "Increase budget 50% in November"
  }>
  
  // What differentiates top performers from average
  topPerformerTraits: string[]
  // "Top performers use social proof in 80% of ads"
  // "Top performers rotate creatives every 14 days"
  // "Top performers allocate 60%+ of budget to LinkedIn"
}
```

```typescript
// When a NEW B2B SaaS customer joins on day 1, they immediately
// benefit from everything we've learned from all previous ones.

async function getIndustryPriors(industry: string): Promise<IndustryPriors> {
  const peers = await db.select().from(brandProfiles)
    .where(eq(brandProfiles.industry, industry))
  
  if (peers.length < 10) {
    // Not enough data — use published benchmarks
    return PUBLISHED_BENCHMARKS[industry]
  }
  
  // We have real data — this is gold
  return calculateIndustryIntelligence(peers)
}
```

This means:
- Customer 1 in B2B SaaS has to figure everything out from benchmarks
- Customer 50 gets: "Based on 49 similar companies, here's exactly what works"
- Customer 500 gets: "We've analyzed 12 million ads in your industry. Here's the optimal campaign."

The more customers → the smarter the product → the better each customer's results → the more customers.

---

## The profile data model (complete)

```typescript
interface LiveProfile {
  // ─── Layer 1: Static identity ───
  identity: { ... }            // See above
  brand: { ... }               // See above
  digitalPresence: { ... }     // See above
  
  // ─── Layer 2: Learned behavior ───
  preferences: {
    copyTone: string
    headlinePreference: 'shorter' | 'same' | 'longer'
    controlLevel: 'hands-off' | 'moderate' | 'hands-on'
    preferredPlatforms: string[]
    preferredFormats: string[]
    languagePreference: 'sv' | 'en'
    editPatterns: EditPattern[]
    approvalSpeed: number
  }
  
  goals: {
    primaryObjective: string
    growthStage: 'startup' | 'scaleup' | 'established'
    budgetComfort: 'testing' | 'growth' | 'scale'
    urgencyLevel: 'relaxed' | 'moderate' | 'urgent'
    painPoints: string[]
  }
  
  audience: {
    description: string
    isB2B: boolean
    locations: string[]
    ageRange: { min: number, max: number } | null
    jobTitles: string[]
    industries: string[]
    companySize: string[]
    buyingCycleLength: 'short' | 'medium' | 'long'
    customerPainPoints: string[]
  }
  
  // ─── Layer 3: Performance intelligence ───
  performance: {
    winningPatterns: WinningPatterns
    losingPatterns: LosingPatterns
    creativeDNA: CreativeDNA
    budgetIntelligence: BudgetIntelligence
    seasonalPatterns: SeasonalPattern[]
    bestEverCampaign: CampaignSummary
    industryPosition: IndustryPosition
  }
  
  // ─── Competitor tracking ───
  competitors: {
    tracked: CompetitorProfile[]
    lastChecked: Date
    alerts: CompetitorAlert[]
  }
  
  // ─── Trigger state ───
  triggers: {
    active: string[]
    lastFired: Record<string, Date>
    pendingRecommendations: Recommendation[]
  }
  
  // ─── Meta ───
  meta: {
    completeness: number
    daysActive: number
    totalCampaigns: number
    totalSpend: number
    lastActivity: Date
    profileVersion: number
  }
}
```

---

## The weekly profile update cycle

Every Monday at midnight, the profile goes through a refresh cycle:

```typescript
inngest.createFunction(
  { id: 'profile-weekly-refresh' },
  { cron: '0 0 * * 1' },  // Monday midnight
  async ({ step }) => {
    const allActiveOrgs = await getActiveOrganizations()
    
    for (const org of allActiveOrgs) {
      await step.run(`refresh-${org.id}`, async () => {
        
        // 1. Re-check competitor ads (Meta Ad Library)
        await refreshCompetitorIntel(org.id)
        
        // 2. Re-check Google reviews (new reviews?)
        await refreshGoogleReviews(org.id)
        
        // 3. Re-check social media activity
        await refreshSocialPresence(org.id)
        
        // 4. Update performance profile with last week's data
        await updatePerformanceProfile(org.id)
        
        // 5. Recalculate industry position
        await updateIndustryPosition(org.id)
        
        // 6. Update creative DNA
        await updateCreativeDNA(org.id)
        
        // 7. Check for seasonal opportunities
        await checkSeasonalTriggers(org.id)
        
        // 8. Generate weekly digest
        await generateWeeklyDigest(org.id)
        
        // 9. Update profile completeness score
        await recalculateCompleteness(org.id)
        
        // 10. Run all triggers
        await runProfileTriggers(org.id)
      })
    }
  }
)
```

---

## Why this is the moat

A competitor can copy our UI in a week.
A competitor can copy our ad templates in a month.
A competitor can even copy our pipeline architecture.

But they cannot copy:
- 6 months of learned preferences for each customer
- The performance data that teaches us what works for each industry
- The cross-customer intelligence network
- The trigger system that proactively helps customers
- The AI context that makes every conversation feel like talking to a colleague who knows your business

The profile IS the product. Everything else is infrastructure to make the profile smarter.

---

## Build it exactly as specified. The profile is the soul of Doost AI.
