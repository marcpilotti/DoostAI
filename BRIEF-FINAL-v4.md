# BRIEF.md — Doost AI Onboarding Wizard (FINAL v4)

> **Den slutgiltiga briefen.** Ersätter alla tidigare versioner.
> Inkluderar: 8-slide viewport design, Satori rendering, alla pipeline-fixar, 16 UX-förbättringar.
> Läs ALLTID DESIGN_REFERENCE.md innan du skriver UI-kod.

---

## Produktöversikt

Doost AI är en kampanjbyggare för svenska småföretag. Wizarden tar en användare från webbadress till publicerade annonser på Meta, Google, LinkedIn (+ TikTok/Snapchat format) i 8 viewport-fit slides.

**Designprinciper:**
- Allt i viewport. Ingen scrollning. Slider-paradigm.
- Inte trångt — vackert, luftigt, enkelt att ta sig igenom.
- Scandinavian tech aesthetic + implicit AI presence.
- Varje slide: ETT fokus, ETT beslut.

---

## Stack

```
Befintligt:
├── Next.js 14 (App Router), Supabase, Tailwind + shadcn/ui
├── Framer Motion, Inngest, Anthropic Claude API

Nytt:
├── zustand, zod, next-intl, cheerio
├── satori + @resvg/resvg-js + sharp       # Ad rendering
├── @fal-ai/serverless-client               # Flux 1.1 Ultra
├── embla-carousel-react                    # Mobil ad-swipe (Slide 5 mobil)
├── oauth4webapi, canvas-confetti
├── Magic UI (number ticker, shimmer border)

Tjänster:
├── Brandfetch + Logo.dev (fallback)        # Brand extraction
├── fal.ai (Flux 1.1 Ultra $0.06/bild)     # Bildgenerering
├── Resend ($20/mån)                        # Magic link e-post
├── Vercel Pro ($20/mån)                    # 300s timeout
└── Supabase Pro ($25/mån)                  # DB + Storage
```

**Rendering:** Satori → SVG → resvg → PNG → sharp → JPEG.
Upgrade path: @sparticuz/chromium (Puppeteer på Vercel) om Satori inte räcker i v2+.

---

## Viewport layout

```css
.wizard-container { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
.wizard-header { height: 56px; flex-shrink: 0; }
.wizard-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; overflow: hidden; }
.wizard-footer { height: 72px; flex-shrink: 0; }
.slide-content { max-width: 640px; width: 100%; }
```

### Header / Progress bar [UX #18]

```
┌──────────────────────────────────────────────────────┐
│  [Doost]    ████████░░░░░░  Steg 3 av 8   ✓ Sparat  │
└──────────────────────────────────────────────────────┘
```

- Gradient progress bar med ai-breathe glow på framkanten.
- "✓ Sparat" visas 2s efter varje state-change, sedan fade out. [UX #17]
- **Hover på progress bar → tooltip med alla steg-namn:** [UX #18]

```
┌────────────────────────────┐
│ ✓ Webbplats                │
│ ✓ Varumärke                │
│ ● Målgrupp     ← du är här│
│ ○ Plattformar              │
│ ○ Annonser                 │
│ ○ Budget                   │
│ ○ Targeting                │
│ ○ Publicera                │
└────────────────────────────┘
```

Klick på slutfört steg → navigera dit direkt. Framtida steg → disabled.

### Footer

```
┌──────────────────────────────────────────────────────┐
│  [← Tillbaka]                    [Primär CTA →]      │
└──────────────────────────────────────────────────────┘
```

CTA har ai-breathe. Text ändras per slide. Ghost button vänster.

### Slide transitions

Horisontell slide + fade + scale. Spring physics (damping 28, stiffness 250).
Framåt: ut åt vänster, in från höger. Bakåt: tvärtom.
Exit: 200ms. Enter: 400ms. `AnimatePresence mode="wait"`.

---

## SLIDE 1: URL Input

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         Ange din webbadress så skapar vi             │
│            dina annonser med AI                      │
│                                                      │
│         ┌──────────────────────────────────┐         │
│         │  mittforetag.se              🔍  │         │
│         └──────────────────────────────────┘         │
│                                                      │
│         ★★★★★  Används av 500+ svenska företag       │  ← [UX #1]
│         [logo] [logo] [logo] [logo] [logo]           │
│                                                      │
└──────────────────────────────────────────────────────┘
CTA: "Analysera →"
```

### [UX #1] Social proof

Under inputfältet: "★★★★★ Används av 500+ svenska företag" + 5 små logotyper.
Tiny, `--color-text-muted`, inte dominant. Tills riktiga kunder finns: använd generiska branschikoner eller "Gratis att testa · Inga konton krävs · Klart på 2 min".

### Input-beteende

- ai-border (gradient border) + stor (48px höjd)
- Auto-prepend `https://`. Zod-validering.
- Submit → allt fade up → loading tar över.

### Loading (5-15s)

Fas 1 (0-3s): Pulsande glow center. "Hämtar din webbplats..."
Fas 2 (3-6s): Glow → kundens logotyp (crossfade). Färgdots emergerar. "Analyserar varumärke..."
Fas 3 (6-10s): Logo + färger glider till brand card-positioner. "Identifierar målgrupp..."
Fas 4 (10s+): Brand card monteras. Gleam-sweep. "Klart!" → auto-transition till Slide 2.

---

## SLIDE 2: Brand Card

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    ┌─────────────────────────────────────────────┐   │
│    │  [Logo]   Företagsnamn                 [✎]  │   │
│    │           bransch · underbransch             │   │
│    │                                             │   │
│    │  "AI-beskrivning baserad på webbplatsen."   │   │
│    │                                             │   │
│    │  ██ Primary  ██ Secondary  ██ Accent        │   │
│    │                                             │   │
│    │  Produkter: Klipp · Styling · Färgning      │   │  ← bara om hittade
│    │  Erbjudande: 20% rabatt första besöket      │   │  ← bara om hittade
│    └─────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
CTA: "Fortsätt →"
```

### [UX #10] Tomma fält-hantering

Visa BARA sektioner som har data. Om inga produkter hittades → visa inte "Produkter:"-raden.
Om inget erbjudande → visa inte den raden. Kortet ser fortfarande komplett ut.

```tsx
{brand.products.length > 0 && <Section label="Produkter" items={brand.products} />}
{brand.prices.length > 0 && <Section label="Priser" items={brand.prices} />}
{brand.offers.length > 0 && <Section label="Erbjudande" items={brand.offers} />}
// Om INGET extra hittades: visa bara logo + namn + beskrivning + färger
// Fortfarande snyggt. Aldrig tomma rader.
```

Om lite hittades, visa diskret CTA: "Lägg till mer information → [✎]"

### [UX #11] Mikro-copy

Under rubrik: *"Så ser ditt varumärke ut för AI:n. Redigera om något stämmer dåligt."*
`text-caption`, `--color-text-muted`.

---

## SLIDE 3: Målgrupp & USPs

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    Din målgrupp (AI-föreslagen)                [✎]   │
│    Dessa påverkar dina annonstexter.                 │  ← [UX #11]
│                                                      │
│    Intressen                                         │
│    [Mode] [Skönhet] [Hårvård] [Livsstil] [+]        │
│                                                      │
│    Utmaningar                                        │
│    [Hitta bra frisör] [Rimligt pris] [+]             │
│                                                      │
│    ───────────────────────────────────────────        │
│                                                      │
│    Dina unika fördelar                        [✎]   │
│    1. 20% rabatt på första besöket                   │
│    2. Online-bokning direkt                          │
│    3. 15 års erfarenhet                              │
│                                                      │
└──────────────────────────────────────────────────────┘
CTA: "Fortsätt →"
```

Ingen ålder här (bara på Slide 7). Kvalitativt: vem är kunden? Kvantitativt targeting separat.

---

## SLIDE 4: Välj plattformar

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    Var vill du synas?                                │
│    Välj de plattformar där dina kunder finns.        │  ← [UX #11]
│                                                      │
│    💡 Vi rekommenderar Meta + Google för din bransch  │  ← [UX #5]
│                                                      │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│    │ 🔵 Meta  │  │ 🟢 Google│  │ 🔵 Linked│        │
│    │ Facebook │  │ Sök &    │  │ B2B &    │        │
│    │ Insta    │  │ Display  │  │ företag  │        │
│    │ ✓ Rekom. │  │ ✓ Rekom. │  │          │        │
│    │  [✓ Vald]│  │  [✓ Vald]│  │  [○ Välj]│        │
│    └──────────┘  └──────────┘  └──────────┘        │
│                                                      │
│    ┌──────────┐  ┌──────────┐  ┌░░░░░░░░░░┐        │
│    │ 🎵 TikTok│  │ 👻 Snap  │  │ ░░░░░░░░ │        │
│    │ Video &  │  │ Stories &│  │ KOMMER   │        │
│    │ Reels    │  │ Spotlight│  │ SNART    │        │
│    │  [○ Välj]│  │  [○ Välj]│  │ (suddig) │        │
│    └──────────┘  └──────────┘  └░░░░░░░░░░┘        │
│                                                      │
└──────────────────────────────────────────────────────┘
CTA: "Skapa annonser →"
```

### [UX #5] AI-rekommendation

"💡 Vi rekommenderar Meta + Google för din bransch" — baserad på Claude's branschanalys.
"✓ Rekom." badge (liten, `--color-primary`) på rekommenderade kort.
Genereras i Step 1 brand-analysen (Claude returnerar `recommendedPlatforms`).

### [UX #14] Bekräftelseanimation vid plattformsval

Välj: kortet höjer sig (translateY -2px, spring). Border morphar till primary (200ms). Checkmark dyker upp med pathLength-animation.
Avmarkera: kortet sjunker tillbaka. Border fadar till muted. Checkmark ritar sig bakåt.

### 3×2 grid

```css
.platform-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 580px; }
```

"Kommer snart"-kort: `backdrop-filter: blur(6px)`, opacity 0.5, pointer-events none, puls på badge.

---

## SLIDE 5: Dina annonser

```
┌──────────────────────────────────────────────────────┐
│    Dina annonser                                     │
│    [● Meta] [○ Google] [○ TikTok]    2 av 4 valda   │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐     │
│  │ ┌────────────────┐ │  │ ┌────────────────┐ │     │
│  │ │○ Företagsnamn  │ │  │ │                │ │     │
│  │ │Sponsrad        │ │  │ │  [Brand ad     │ │     │
│  │ │                │ │  │ │   solid color  │ │     │
│  │ │ [Hero ad       │ │  │ │   + logo      │ │     │
│  │ │  med bild]     │ │  │ │   + text]     │ │     │
│  │ │                │ │  │ │                │ │     │
│  │ │👍 Gilla 💬 Dela│ │  │ │                │ │     │
│  │ └────────────────┘ │  │ └────────────────┘ │     │
│  │ [✓ Vald]      [✎] │  │ [○ Välj]      [✎] │     │
│  └────────────────────┘  └────────────────────┘     │
│                                                      │
│  [🔄 Generera om]                                    │  ← [UX #13]
└──────────────────────────────────────────────────────┘
CTA: "Ställ in budget →" (kräver ≥1 vald)
```

### [UX #6] Platform preview-ramar

Varje annons wrappas i en förenklad plattformsmockup:

**Meta-ram:**
```
┌─────────────────────┐
│ ○ Företagsnamn       │  ← Profilrad (statisk)
│ Sponsrad             │
│ ┌─────────────────┐ │
│ │  [RENDERED AD]  │ │  ← Satori-renderad bild
│ └─────────────────┘ │
│ 👍 Gilla  💬 Komm.  ↗│ ← Simulerad interaktion
└─────────────────────┘
```

**Google Display-ram:**
```
┌─────────────────────┐
│ Annons · företag.se  │
│ ┌─────────────────┐ │
│ │  [RENDERED AD]  │ │
│ └─────────────────┘ │
└─────────────────────┘
```

**LinkedIn-ram:**
```
┌─────────────────────┐
│ [Logo] Företagsnamn  │
│ Sponsrad · 1 234 följare │
│ ┌─────────────────┐ │
│ │  [RENDERED AD]  │ │
│ └─────────────────┘ │
│ 👍 12  💬 3  ↗ 1    │
└─────────────────────┘
```

React-komponent `<PlatformMockup platform="meta">` som wrappar annonsbilden. Ren CSS. Mockup-data fylls med företagsnamn och logo från brand card.

### [UX #8] Mobil: stapla vertikalt

```css
/* Desktop: sida vid sida */
.ad-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* Mobil (<640px): en åt gången */
@media (max-width: 640px) {
  .ad-pair { grid-template-columns: 1fr; }
  /* Embla mini-carousel: swipe mellan Hero och Brand */
  /* Dot indicators: ● ○ */
}
```

### [UX #13] "Generera om alla"

Knapp under annonserna: "🔄 Generera om"
Klick → ny Claude-call (ny copy) + ny Flux-generering (om AI-bilder) + nya renders.
Prompten inkluderar: `"Generera NYA varianter. Undvik dessa headlines: [lista på förra]"`

### [UX #14] Bekräftelseanimation vid val

Välj annons: checkmark ritar sig (pathLength 0→1, 300ms). Kort pulserar (scale 1→1.02→1, spring). Räknaren animeras (+1).
Avmarkera: checkmark ritar sig bakåt. Kort sjunker.

### [UX #12] Live preview vid textredigering

Edit overlay (slide-up panel inom viewport, inte modal):

```
┌─── Edit overlay ──────────────────────────────┐
│                                               │
│  ┌─────────────────┐  Headline:               │
│  │                 │  ┌────────────────────┐  │
│  │  [Live preview  │  │ Boka klippning idag│  │
│  │   updates as    │  └────────────────────┘  │
│  │   you type]     │                          │
│  │                 │  Brödtext:                │
│  │  ↑ CSS-klon av  │  ┌────────────────────┐  │
│  │    template     │  │ Få 20% rabatt...   │  │
│  └─────────────────┘  └────────────────────┘  │
│                                               │
│  Bild: [Webb-bild ●] [Webb-bild ○] [🎨 AI]  │
│                                               │
│                         [Spara]  [Avbryt]     │
└───────────────────────────────────────────────┘
```

**Vänster:** `<AdPreviewLive>` — CSS-klon av Satori-templaten. Samma layout, fonter, färger. Ren HTML/CSS, uppdateras via React state medan användaren skriver.
**Vid "Spara":** Satori renderar slutgiltig bild server-side. Tar ~1s. Visa spinner på knappen.

### Tab-switch = instant

ALLA annonser pre-renderas vid generation. Tab-switch byter bara vilka bilder som visas i zustand state. Ingen rendering vid tab-byte.

### Pre-rendering strategi

```ts
// Alla körs PARALLELLT vid transition Slide 4→5:
const [copy, images] = await Promise.all([
  generateCopy(brand, platforms),     // Claude Opus ~3-5s
  getImages(scrapedImages, brand),    // Webb 0s / Flux ~4-6s
]);

// Alla renders PARALLELLT:
const renders = await Promise.all(
  selectedPlatforms.flatMap(p => [
    renderAd({ platform: p, template: 'hero', copy, images }),
    renderAd({ platform: p, template: 'brand', copy, images }),
  ])
);
// Typiskt 4 renders (Meta+Google): ~1.2s parallellt
// Total: ~6-8s (webb-bilder) / ~8-11s (Flux)
```

---

## SLIDE 6: Budget & Schema

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    Budget & schema                                   │
│    Du betalar aldrig mer. Ingen bindningstid.        │  ← [UX #11]
│                                                      │
│    Vart ska annonsen länka?                          │
│    ┌──────────────────────────────────────┐          │
│    │ https://mittforetag.se               │          │
│    └──────────────────────────────────────┘          │
│                                                      │
│    Total budget                                      │
│    ├────────────────●──────────────────────┤         │
│    5 000 kr                            SEK ▼         │
│    → Beräknad räckvidd: 12K – 25K visningar          │  ← [UX #7]
│                                                      │
│    Kampanjperiod                                     │
│    (7d)  (14d)  (● 30 dagar)  (Anpassat)            │
│    mån 7 apr → ons 7 maj                             │  ← [UX #16]
│                                                      │
│    💡 Vi optimerar budgetfördelningen automatiskt     │
│                                                      │
└──────────────────────────────────────────────────────┘
CTA: "Fortsätt →"
```

### [UX #7] Budget → projektion inline

En rad under budget-slider: "→ Beräknad räckvidd: 12K – 25K visningar"
**Uppdateras live** med number ticker-animation (Magic UI) när slider dras (debounce 200ms).
`text-body-sm`, `--color-text-secondary`. Projektionstalet i `--color-text-primary` (starkare).

### [UX #16] Smartare datumdefaults

```ts
function getSmartStartDate(): string {
  const now = new Date();
  const day = now.getDay(); // 0=sön, 6=lör
  const daysToAdd = day === 5 ? 3 : day === 6 ? 2 : day === 0 ? 1 : 1;
  const start = new Date(now.getTime() + daysToAdd * 86400000);
  return start.toISOString().split('T')[0];
}
```

Visar "mån 7 apr" istället för "idag". Ger plattformarna tid att granska.

### [UX #11] Mikro-copy

"Du betalar aldrig mer. Ingen bindningstid." — under rubriken. Muted, men lugnar.

---

## SLIDE 7: Targeting + Projektioner

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    Vem ska se dina annonser?                         │
│    Ju mer specifik, desto bättre resultat.           │  ← [UX #11]
│                                                      │
│    Plats                                             │
│    ┌────────────────────────────────┐                │
│    │ 🔍 Malmö                   ✕  │                │  ← [UX #4] auto-detekterat
│    └────────────────────────────────┘                │
│    + Stockholm  + Göteborg  + Hela Sverige           │
│                                                      │
│    Ålder  [25 ●══════════● 55]   Kön  [● Alla ▼]   │
│                                                      │
│    ──────── Beräknad räckvidd (±40%) ────────        │
│                                                      │
│       12K – 25K       340 – 680      2.1 – 3.2%     │
│       visningar        klick           CTR           │
│                                                      │
│    ⓘ Uppskattning baserad på branschdata             │
│                                                      │
└──────────────────────────────────────────────────────┘
CTA: "Granska kampanj →"
```

### [UX #4] Smart platsdetektering

Plats förifylld baserat på webbplatsens scraping (steg 1):

```ts
// I scraper.ts, extrahera plats från:
// 1. schema.org LocalBusiness → address
// 2. Footer: postnummer-mönster (\d{3}\s?\d{2})
// 3. Google Maps-iframe-URL
// 4. "Besök oss" / "Hitta oss"-sektioner
// 5. Brandfetch address

// I Claude-analysen: "Var är detta företag baserat? Returnera stad."
```

Default: detekterad stad (t.ex. "Malmö"). Om inget hittas → "Hela Sverige".

### [UX #14] Projektionstalen animeras

Number ticker (Magic UI) vid varje targeting-ändring. Smooth count-animation 600ms ease-out.
Visuell koppling: kort flash/highlight på projektionssiffrorna vid input-ändring.

### LinkedIn-extra (kollapsad, bara om vald)

```
│    ▸ LinkedIn-targeting (valfritt)                   │
│    ─── expanderad: ─────────────────────────         │
│    Företagsstorlek  [11-50] [51-200] [200+]          │
│    Roller           [VD] [Marknadschef] [+]          │
```

---

## SLIDE 8: Review & Publish

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    Kampanjöversikt                                   │
│                                                      │
│    [Logo] Företagsnamn                               │
│    4 annonser · Meta + Google · 5 000 kr · 30 dagar │
│    12K–25K visn. · Malmö · 25-55 år                 │
│                                                      │
│    ─────────────────────────────────────────         │
│                                                      │
│    Hur vill du publicera?                            │
│                                                      │
│    ┌─────────────────────────────────────────────┐   │
│    │  🔗  Anslut dina konton                     │   │
│    │      Koppla Meta, Google, etc.              │   │
│    │      och publicera direkt.            [→]   │   │
│    └─────────────────────────────────────────────┘   │
│                                                      │
│    ┌─────────────────────────────────────────────┐   │
│    │  🚀  Vi publicerar åt dig                   │   │
│    │      Inga konton? Vi sköter allt.           │   │
│    │      Ingår i din plan.                [→]   │   │  ← [UX #15]
│    └─────────────────────────────────────────────┘   │
│                                                      │
│    Genom att fortsätta godkänner du villkoren        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### [UX #15] Pricing-transparens

"Vi publicerar åt dig"-kortet måste vara tydligt med kostnad:
- Om gratis: "Ingår i din plan — ingen extra kostnad."
- Om extra: "Från 499 kr/mån — vi sköter allt."
- ALDRIG otydligt. Osäkerhet = drop-off.

### Flöde A: "Anslut dina konton"

Klick → expandera till OAuth-knappar (inom viewport):

```
│    🔵 Meta       [Anslut]  → Välj sida: [Dropdown]  │
│    🟢 Google     [Anslut]  → Välj konto             │
│    🔵 LinkedIn   [Anslut]  → Välj sida              │
│                                                      │
│    ┌──────────────────────────────────────┐          │
│    │  🚀  Skapa konto & publicera         │          │
│    └──────────────────────────────────────┘          │
```

### Flöde B: "Vi publicerar åt dig"

Klick → ersätt med:

```
│    Perfekt! Vi sköter publiceringen.                 │
│                                                      │
│    1. Skapa konto (gratis)                           │
│    2. Vi granskar din kampanj                        │
│    3. Publicering inom 24h                           │
│    4. Följ resultaten i dashboarden                  │
│                                                      │
│    ┌──────────────────────────────────────┐          │
│    │  🚀  Skapa konto & skicka kampanj    │          │
│    └──────────────────────────────────────┘          │
```

Status i DB: `pending_managed`. Team-notis via Inngest.

### Kampanjer startar som PAUSED

Alla kampanjer (self-serve och managed) startar som PAUSED.
Success-screen visar: "Din kampanj är redo! Aktivera den i dashboarden."

### [UX #20] Post-publish: Dela på LinkedIn

```
    🎉 Din kampanj är redo!
    
    4 annonser · Meta + Google · 5 000 kr

    ┌─────────────────────────────────────┐
    │  📱  Jag skapade just mina första  │
    │      AI-annonser med @DoostAI      │
    │      på under 2 minuter!           │
    │                                     │
    │  [Dela på LinkedIn]  [Kopiera länk] │
    └─────────────────────────────────────┘
    
    [Aktivera kampanj →]  [Gå till dashboard →]
```

Pre-skriven text (redigerbar). LinkedIn-share primär (viktigast B2B). Kopibar länk sekundär.
Konfetti-animation bakom.

---

## Pipeline: Brand Extraction

```
POST /api/brand/extract { url }

1. Validera URL (zod)
2. fetch(url) → HTML (timeout 10s)
3. cheerio → text, bilder, metadata, priser, CTAs, schema.org
   + PLATS-EXTRAKTION: schema.org address, postnummer, Maps-iframe  ← [UX #4]
4. Brandfetch API → logo, färger, fonter
   (misslyckande → Logo.dev fallback → manuell input)
5. Claude Sonnet analyserar fulltext + Brandfetch:
   - Bransch, produkter, priser, erbjudanden, USPs, målgrupp, ton
   - Plats (stad/kommun) ← [UX #4]
   - Rekommenderade plattformar med motivering ← [UX #5]
   - LinkedIn-suggestions (roller, företagsstorlek)
6. Streama progress → BrandProfile + ScrapedImages + detectedLocation + recommendedPlatforms
```

## Pipeline: Ad Generation

```
POST /api/ads/generate { brandProfile, scrapedContent, scrapedImages, selectedPlatforms }

1. Claude Opus → copy per plattform (med CTA-enum för Meta, long_headline för Google)
   + policy-validering
2. Programmatisk teckenantal-validering (trunkera om Claude överskrider)
3. Bilder: webbplatsbilder först (>600px, kvalitetskoll) → Flux 1.1 Ultra om behov
4. Satori renderar: 2 templates (Hero + Brand) × valda format
   ALLA parallellt — tab-switch instant
5. Upload till Supabase Storage
6. Supabase Realtime → UI
```

## Pipeline: Publishing

```
Inngest step function per plattform (retries, steg-recovery)

META: refresh token → upload bild → image HASH → campaign (PAUSED, OUTCOME_TRAFFIC)
      → ad set (LOWEST_COST_WITHOUT_CAP) → creative (page_id + hash) → ad
GOOGLE: refresh token → budget → campaign (DISPLAY, MAXIMIZE_CLICKS)
        → ad group → assets → responsive display ad (final_urls, business_name, long_headline)
LINKEDIN: refresh token → upload asset → campaign (WEBSITE_VISITS, SPONSORED_UPDATES)
          → creative (org URN, SINGLE_IMAGE)
```

---

## Databasschema

```sql
-- Temp sessions, brand_profiles (med products, prices, offers, detected_location),
-- ad_creatives (med cta_enum, image_source), campaigns (med landing_urls,
-- linkedin_targeting, status inkl. 'pending_managed'), ad_platform_connections
-- (med page_id/page_name), published_ads, managed_publish_requests
-- (Se BRIEF v3 för fullständigt schema + managed_publish_requests)
```

---

## Filstruktur

```
src/
├── hooks/
│   └── use-wizard-navigation.ts        # Egen hook (15 rader)
├── stores/
│   └── wizard-store.ts                 # Med: recommendedPlatforms, detectedLocation
├── lib/
│   ├── brand/
│   │   ├── scraper.ts                  # cheerio + plats-extraktion
│   │   ├── brandfetch.ts, logodev.ts, analyze.ts
│   ├── ads/
│   │   ├── copy-generator.ts           # Claude Opus, med CTA-enum mapping
│   │   ├── image-strategy.ts           # Webb-bilder först
│   │   ├── image-generator.ts          # Flux 1.1 Ultra
│   │   ├── renderer.ts                 # Satori + resvg + sharp
│   │   └── templates/
│   │       ├── hero.tsx                # Satori JSX
│   │       └── brand-focus.tsx
│   ├── platforms/
│   │   ├── meta.ts                     # Inkl. image hash, page listing
│   │   ├── google.ts                   # Responsive display ad
│   │   ├── linkedin.ts                 # Org URN, company targeting
│   │   └── oauth.ts
│   ├── projections/calculator.ts       # Ranges ±40%
│   ├── session/temp-session.ts
│   └── i18n/sv.json
├── inngest/functions/
│   └── publish-campaign.ts             # Step functions
├── app/[locale]/
│   ├── onboarding/page.tsx, layout.tsx
│   └── api/ (brand/extract, ads/generate, campaigns/publish, auth/[platform])
└── components/wizard/
    ├── WizardShell.tsx                  # 100dvh, progress bar med hover-namn [UX #18]
    ├── ProgressBar.tsx                  # Med: hover tooltip, "✓ Sparat" [UX #17]
    ├── SlideTransition.tsx
    ├── slides/
    │   ├── UrlInputSlide.tsx            # Med: social proof [UX #1]
    │   ├── BrandCardSlide.tsx           # Med: tomma fält-hantering [UX #10]
    │   ├── AudienceSlide.tsx            # Utan: ålder (flyttad till Slide 7)
    │   ├── PlatformSelectSlide.tsx      # Med: AI-rekommendation [UX #5], TikTok, Snap, Coming Soon
    │   ├── AdViewSlide.tsx              # Med: 2 sida vid sida, mockup-ramar [UX #6], mobil-stack [UX #8]
    │   ├── BudgetSlide.tsx              # Med: inline projektion [UX #7], smart datum [UX #16]
    │   ├── TargetingSlide.tsx           # Med: auto-plats [UX #4]
    │   └── ReviewPublishSlide.tsx       # Med: pricing [UX #15], LinkedIn-share [UX #20]
    └── shared/
        ├── PlatformMockup.tsx           # Meta/Google/LinkedIn-ramar [UX #6]
        ├── AdPreviewLive.tsx            # CSS-klon för live edit [UX #12]
        ├── EditOverlay.tsx              # Slide-up panel [UX #12]
        ├── NumberTicker.tsx             # Magic UI-inspirerad [UX #14]
        ├── EmptySection.tsx             # "Lägg till info" CTA [UX #10]
        └── SharePost.tsx               # LinkedIn-delning [UX #20]
```

---

## Timeline: 14 dagar

| Dag | Innehåll | UX-features inkluderade |
|-----|----------|------------------------|
| 1 | Foundation: shell, progress bar, transitions, zustand, temp sessions | #17 Sparat, #18 Hover-namn |
| 2 | Slide 1 (URL) + webbskrapning + Brandfetch + plats-extraktion | #1 Social proof, #4 Plats |
| 3 | Slide 2 (Brand card) + Claude-analys + progressiv revelation | #10 Tomma fält, #11 Mikro-copy |
| 4 | Slide 3 (Målgrupp) + Slide 4 (Plattformar + TikTok/Snap) | #5 Rekommendation, #14 Animationer |
| 5 | Ad pipeline: Claude Opus copy + bildstrategi + Satori | |
| 6 | Slide 5: 2 ads + PlatformMockup + mobil stack | #6 Ramar, #8 Mobil, #13 Generera om |
| 7 | Slide 5: EditOverlay + AdPreviewLive | #12 Live preview, #14 Val-animationer |
| 8 | Slide 6 (Budget) + Slide 7 (Targeting) | #7 Inline proj., #16 Datum |
| 9 | Slide 8 (Review) + auth + managed publish option | #15 Pricing, #20 LinkedIn-share |
| 10 | OAuth (Meta + page, Google, LinkedIn + org) | |
| 11 | Inngest publishing: Meta (image hash) + Google | |
| 12 | Inngest publishing: LinkedIn + success screen + konfetti | #20 Share |
| 13 | Error handling + mobile testing + rate limiting | |
| 14 | Polish + analytics + final test + deploy | |

---

## Dag 0: Gör detta IDAG

1. Ansök om Meta, Google Ads, LinkedIn developer API access
2. Skapa Brandfetch + fal.ai + Resend-konton
3. Uppgradera Vercel Pro + Supabase Pro
4. Ladda ner Satoshi (fontshare.com)
5. Läs DESIGN_REFERENCE.md
6. Kör `npx create-next-app` eller börja i befintligt repo
