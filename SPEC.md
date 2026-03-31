# Doost AI — URL-first Onboarding Spec v3 (No Chat, No Scroll)

## Grundprinciper

**1. Chatten finns INGENSTANS i produkten.** Hela produkten är byggd med rena UI-komponenter.

**2. Man scrollar ALDRIG.** Varje steg äger hela viewporten — `100vh`, `overflow: hidden`. Stegen byter som slides med smooth transitions. Inget staplas, inget scrollas.

**3. AI-känslan skapas med animerade mikro-meddelanden.** Små textmeddelanden fades/types in ("Analyserar ditt varumärke...", "Hittade 6 färger...", "Bygger din annons...") som ger känslan av att en intelligent process pågår — utan att det är en chatbubbla.

---

## UX-modellen: Slides med AI-meddelanden

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           Hela viewporten (100vh)                │
│                                                  │
│     ┌────────────────────────────────────┐       │
│     │                                    │       │
│     │        AKTIVT STEG                 │       │
│     │     (centrerat, max-width)         │       │
│     │                                    │       │
│     └────────────────────────────────────┘       │
│                                                  │
│     "AI analyserar ert varumärke..."  ← fade-in  │
│                                                  │
└──────────────────────────────────────────────────┘
         │
         │  smooth slide transition (300-400ms)
         ▼
┌──────────────────────────────────────────────────┐
│                                                  │
│           Hela viewporten (100vh)                │
│                                                  │
│     ┌────────────────────────────────────┐       │
│     │                                    │       │
│     │        NÄSTA STEG                  │       │
│     │     (centrerat, max-width)         │       │
│     │                                    │       │
│     └────────────────────────────────────┘       │
│                                                  │
│     "Stämmer det här?"               ← fade-in   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Teknisk implementation

```typescript
// Container: alltid 100vh, overflow hidden
<div className="h-screen overflow-hidden relative">
  <AnimatePresence mode="wait">
    {step === 'url'      && <URLSlide key="url" />}
    {step === 'loading'  && <LoadingSlide key="loading" />}
    {step === 'brand'    && <BrandSlide key="brand" />}
    {step === 'editor'   && <EditorSlide key="editor" />}
    {step === 'publish'  && <PublishSlide key="publish" />}
    {step === 'done'     && <DoneSlide key="done" />}
  </AnimatePresence>
</div>

// Varje slide: Framer Motion med slide-animation
const slideVariants = {
  enter:  { opacity: 0, y: 40 },
  center: { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -20 },
};

function URLSlide() {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-screen flex flex-col items-center justify-center"
    >
      {/* Innehåll centrerat mitt på skärmen */}
    </motion.div>
  );
}
```

### AI-meddelanden (den magiska detaljen)

Små, eleganta textmeddelanden som visas under/bredvid det aktiva elementet. De ger känslan av en intelligent process utan att vara en chatbubbla.

```typescript
// Komponent: AIMessage
function AIMessage({ text, delay = 0 }: { text: string; delay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-sm text-muted-foreground text-center mt-4"
    >
      {text}
    </motion.p>
  );
}

// Användning:
<AIMessage text="Analyserar idawargbeauty.se..." delay={0} />
<AIMessage text="Hittade logotyp och 6 färger" delay={3000} />
<AIMessage text="Bygger din varumärkesprofil..." delay={6000} />
```

**Stil:** Liten text (`text-sm`), muted färg, centrerad, fade-in med subtil y-offset. INTE i en bubbla. INTE med en avatar. Bara text som dyker upp — som en statusrad med personlighet.

**Ton:** Kort, aktiv, lite personlig.
- ✓ "Hittade 6 färger och 2 typsnitt"
- ✓ "Er hemsida ser riktigt bra ut!"
- ✓ "Bygger din annons..."
- ✗ "Jag analyserar nu din webbplats för att extrahera varumärkesdata" (för robotigt)
- ✗ "Vänta medan vi processar din förfrågan" (för formellt)

---

## SLIDE 1: URL Input

Hela viewporten. Prompt-boxen centrerad vertikalt och horisontellt. Inget annat.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│            Skapa din första annons                   │
│     Klistra in din hemsida — vi gör resten           │
│                                                      │
│   ┌───────────────────────────────────────────┬──┐   │
│   │ Klistra in din hemsida, t.ex. företag.se  │▶ │   │
│   └───────────────────────────────────────────┴──┘   │
│                                                      │
│     Testa med:  idawargbeauty.se · florist.se        │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Beteende vid submit:**
1. URL valideras client-side
2. Input-fältet disablas, visar den inmatade URL:en
3. Kort fade → SLIDE 2 (loading) tar över hela viewporten

---

## SLIDE 2: Loading / Analys

Hela viewporten. Centrerat. AI-meddelanden dyker upp sekventiellt.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│               ┌──────────────┐                       │
│               │   [spinner]  │                       │  ← Elegant spinner/pulse
│               └──────────────┘                       │
│                                                      │
│            idawargbeauty.se                           │  ← URL:en som referens
│                                                      │
│      "Hämtar er hemsida..."               ← T+0s    │
│      "IDA WARG Beauty — Stockholm"         ← T+3s   │  ← AI-meddelanden
│      "Hittade logotyp och 6 färger"        ← T+5s   │     fades in sekventiellt
│      "Analyserar ert varumärke med AI..."  ← T+8s   │
│                                                      │
│        ━━━━━━━━━━━━━━━━━━━░░░░░  72%                │  ← Minimal progressbar
│                                                      │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Meddelandena är centrerade, staplade vertikalt med ~8px gap.** Varje nytt meddelande fade-in:as. Äldre meddelanden bleknar subtilt (opacity 0.5) så fokus är på det senaste. MAX 4 synliga meddelanden — äldre försvinner.

**Tekniskt:**
```typescript
const [messages, setMessages] = useState<string[]>([]);

// SSE events → lägg till meddelande
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.message) {
    setMessages(prev => [...prev.slice(-3), data.message]); // Max 4 synliga
  }
  if (data.event === 'complete') {
    // Vänta 500ms → transition till SLIDE 3
    setTimeout(() => setStep('brand'), 500);
  }
};
```

**Spinern:** Inte en generisk spinning circle. En pulsande cirkel i brand-grönt, eller en minimal bar-animation. Matchar Doost AI-designen.

**När analysen är klar:** Sista meddelandet: "Klar! Här är din profil" → kort paus (500ms) → smooth slide till SLIDE 3.

---

## SLIDE 3: Brand Card

Hela viewporten. Brand card centrerad. Kompakt — allt syns utan scroll.

**KRITISKT:** Brand card:en måste passa i 100vh UTAN scroll. Det innebär att layouten är kompakt med grids, inte en lång lista.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─ Din varumärkesprofil ─────────────────────────────────────┐ │
│   │                                                             │ │
│   │  ┌──────┐  IDA WARG Beauty                                 │ │
│   │  │ LOGO │  idawargbeauty.se · Skönhet & Hudvård · Sthlm    │ │
│   │  └──────┘                                            [✎]   │ │
│   │                                                             │ │
│   │  ┌─ FÄRGER ───────────┐  ┌─ TYPSNITT ──────────────────┐  │ │
│   │  │ ██ ██ ██ ██ ██     │  │ Heading: Century Gothic      │  │ │
│   │  │ Pri Sek Acc Bg Txt │  │ Body: Inter                  │  │ │
│   │  └────────────────────┘  └──────────────────────────────┘  │ │
│   │                                                             │ │
│   │  ┌─ TONALITET ────────────────────────────────────────────┐│ │
│   │  │ 🗣 Du-tilltal · Varm, feminin, premium · Svenska       ││ │
│   │  │ "Hej du! Upptäck vår nya kollektion av vegansk..."     ││ │
│   │  └────────────────────────────────────────────────────────┘│ │
│   │                                                             │ │
│   │  ┌─ MÅLGRUPP ─────────┐  ┌─ FÖRETAG ──────────────────┐  │ │
│   │  │ Kvinnor 18-35      │  │ 559XXX-XXXX · 5-10 anst.   │  │ │
│   │  │ Skönhet, hudvård   │  │ 2-5 MSEK · Ida Warg, VD    │  │ │
│   │  │ Stockholm + online │  │ Kreditbetyg: A              │  │ │
│   │  └────────────────────┘  └─────────────────────────────┘  │ │
│   │                                                             │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   "Stämmer det här med ert varumärke?"              ← AI msg    │
│                                                                  │
│   [ ✨ Stämmer — skapa min annons → ]                            │
│   Något stämmer inte? Klicka på valfritt fält.                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Layout-strategi: 2-kolumns grid

Allt packas i ett 2-kolumns grid för att maximera informationsdensitet utan scroll:

```
Row 1: Logo + Namn/URL/Bransch/Plats (horisontellt)
Row 2: [Färger]                    [Typsnitt]
Row 3: [Tonalitet — full bredd, 2 rader]
Row 4: [Målgrupp]                  [Företagsdata]
```

**Max height-budget (för 768px viewport — minsta target):**
- Navbar: 64px
- Top padding: 24px
- Brand card: ~420px (med kompakt grid)
- AI-meddelande: 24px
- CTA + hjälptext: 80px
- Bottom padding: 24px
- **Total: ~636px** → ryms i 768px viewport ✓

**Editering:** Klick på ett fält → inline-edit (input/dropdown dyker upp PÅ PLATS, inte i en modal). Inga expanderande sektioner som bryter 100vh-regeln.

**CTA:** "Stämmer — skapa min annons →" → kort animation → SLIDE 4.

---

## SLIDE 4: Annonseditor

Hela viewporten. Split-layout: toolbar uppe, preview centrerad, actions nere.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  MÅL: [Fler kunder ▼]  KANAL: [📷 Instagram ▼]  MÅLGRUPP [✎]  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │   [A] ✓                          [B] 🔒 Pro              │   │
│  │                                                          │   │
│  │   ┌──────────────────────────────────────┐               │   │
│  │   │                                      │               │   │
│  │   │  (I) IDA WARG Beauty                 │               │   │
│  │   │  Sponsrad                            │               │   │
│  │   │                                      │               │   │
│  │   │  [  AI-genererad bakgrundsbild  ] ↻🔒│               │   │
│  │   │                                      │               │   │
│  │   │  Sveriges mest sålda          ✨🔒   │               │   │
│  │   │  brun utan sol 🌟                    │               │   │
│  │   │                                      │               │   │
│  │   │  100% vegansk & älskad...     ✨🔒   │               │   │
│  │   │                                      │               │   │
│  │   │  [Handla nu]                         │               │   │
│  │   │  ♡  💬  ↗                            │               │   │
│  │   └──────────────────────────────────────┘               │   │
│  │                                                          │   │
│  │   📷 Insta ✓ │ 📘 FB 🔒 │ 🔍 Google 🔒                  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  "Här är ert annonsförslag — redigera direkt i texten"  ← AI    │
│                                                                  │
│  [ ← Tillbaka ]             [ Publicera → ]  [ 📥🔒 ] [ 🔗🔒 ] │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Hur editorn ryms i 100vh

**Annons-mockupen måste vara skalbar.** Instagram Feed-format (1:1) renderas i en container med `max-height: 45vh`. Mockupen skalas ned proportionellt. Det ser fortfarande snyggt ut — det är en förhandsgranskning, inte en 1:1-rendering.

**Height-budget (768px viewport):**
- Toolbar (mål/kanal/målgrupp): 48px
- Preview container: ~380px (45vh vid 768+)
- Format-tabs: 36px
- AI-meddelande: 24px
- Action bar: 48px
- Padding: 48px
- **Total: ~584px** → ryms ✓

**Loading-state i editorn:**
När slide 4 laddas visas mockupen som en shimmer-skeleton. AI-meddelanden dyker upp:
- T+0s: "Bygger din annons..."
- T+2s: "Skriver rubrik och text..."
- T+4s: headline streamar in (typewriter-effekt i mockupen)
- T+6s: body text fades in
- T+10s: bakgrundsbild fades in bakom texten

Användaren ser annonsens delar materialiseras en efter en. Ingen spinner — content IS the loading state.

### Inline-redigering (utan scroll)

Klick på headline → text blir editbar (contentEditable eller controlled input). Inga expanderande paneler, inga modaler, inget som bryter viewport-gränsen.

### Mål/Kanal-ändring → regenerering

Vid dropdown-change:
1. Mockupen fades till shimmer-skeleton (300ms)
2. AI-meddelande: "Anpassar din annons för [nytt mål]..."
3. Ny POST till `/api/ad/generate`
4. Nytt content streamar in (samma typewriter-effekt)

Allt händer INOM samma slide. Ingen navigering, ingen scroll.

---

## SLIDE 5: Publicera

Slide-transition från editorn. Publiceringspanelen äger hela viewporten.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ⚡ Publicera kampanj                           │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  ANNONS                                                   │  │
│   │  "Sveriges mest sålda brun utan sol 🌟"                   │  │
│   │  → idawargbeauty.se  ·  📷 Instagram                     │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌─ BUDGET ─────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────────┐  ┌──────────┐           │  │
│   │  │  75 kr/d  │  │ 150 kr/d ★  │  │ 300 kr/d │           │  │
│   │  │  Testa    │  │ Rekommen.   │  │ Fullgas  │           │  │
│   │  └──────────┘  └──────────────┘  └──────────┘           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌─ TID ──────────────┐  ┌─ REGION ────────────────────────┐  │
│   │ [2v ★] [1m] [Löp.] │  │ 📍 Stockholm (25 km)      [✎]  │  │
│   └─────────────────────┘  └─────────────────────────────────┘  │
│                                                                  │
│   Annonsbudget: 150 × 14 = 2 100 kr · Doost AI: Gratis       │
│                                                                  │
│   "Redo att nå tusentals nya kunder?"                ← AI msg   │
│                                                                  │
│           [ ═══ Slide to publish ═══▶ ]                          │
│                                                                  │
│   [ ← Tillbaka till editorn ]                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Om Meta OAuth saknas:** Innan publish-slide visas en mellan-slide:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                                                                  │
│              Koppla ditt annonskonto                             │
│                                                                  │
│   ┌──────────────────────────────────────────────┐              │
│   │   📷  Koppla Meta (Facebook + Instagram)     │              │
│   │       → Öppnar inloggning i nytt fönster      │              │
│   └──────────────────────────────────────────────┘              │
│                                                                  │
│   ✓ Vi får aldrig tillgång till privata meddelanden              │
│   ✓ Du kan koppla bort när som helst                             │
│                                                                  │
│   "Sista steget innan din annons är live!"           ← AI msg   │
│                                                                  │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

OAuth popup → callback → auto-advance till publish-slide.

---

## SLIDE 6: Done

Bekräftelse-slide efter publish. Auto-redirect till dashboard efter 4 sekunder.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                     🚀                                           │
│                                                                  │
│              Din annons är publicerad!                           │
│                                                                  │
│   "Meta granskar din annons — det tar 1-24 timmar"   ← AI msg  │
│   "Vi mejlar dig när den är live"                     ← fade in │
│   "Kolla resultaten i dashboarden imorgon"            ← fade in │
│                                                                  │
│              [ Gå till dashboard → ]                             │
│                                                                  │
│              Omdirigeras automatiskt om 4s...                    │
│                                                                  │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Confetti-animation (subtil, inte over the top). Tre AI-meddelanden fades in sekventiellt (1s mellanrum). Auto-redirect efter 4s, eller klick på CTA.

---

## AI-meddelanden — komplett lista per slide

| Slide | Meddelande | Timing | Trigger |
|-------|-----------|--------|---------|
| **1 URL** | — | — | Inga meddelanden, ren input |
| **2 Loading** | "Hämtar er hemsida..." | T+0s | Firecrawl startar |
| **2 Loading** | "[Företagsnamn] — [Stad]" | T+3s | Roaring klar |
| **2 Loading** | "Hittade logotyp och [N] färger" | T+5s | Logo + CSS klar |
| **2 Loading** | "Analyserar ert varumärke med AI..." | T+8s | Claude startar |
| **2 Loading** | "Klar! Här är din profil" | T+12-18s | complete |
| **3 Brand** | "Stämmer det här med ert varumärke?" | on enter | Slide visas |
| **3 Brand** | "Bra! Nu bygger vi er annons" | on confirm | CTA klickad |
| **4 Editor** | "Bygger din annons..." | T+0s | Generation startar |
| **4 Editor** | "Skriver rubrik och text..." | T+2s | Copy genereras |
| **4 Editor** | "Skapar AI-bakgrund i era färger..." | T+5s | Bild genereras |
| **4 Editor** | "Här är ert annonsförslag — redigera direkt i texten" | T+10s | Allt klart |
| **4 Editor** | "Anpassar din annons för [mål]..." | on change | Dropdown ändrad |
| **5 OAuth** | "Sista steget innan din annons är live!" | on enter | Slide visas |
| **5 Publish** | "Redo att nå tusentals nya kunder?" | on enter | Slide visas |
| **6 Done** | "Meta granskar din annons — det tar 1-24 timmar" | T+0s | Publish klar |
| **6 Done** | "Vi mejlar dig när den är live" | T+1s | Sekventiell |
| **6 Done** | "Kolla resultaten i dashboarden imorgon" | T+2s | Sekventiell |

### AI-meddelande stilguide

```css
.ai-message {
  font-size: 14px;
  color: var(--fg-muted);           /* Dämpad, inte dominerande */
  text-align: center;
  font-family: var(--font-body);    /* DM Sans / Inter */
  letter-spacing: -0.01em;
  transition: opacity 0.4s ease;
}

.ai-message--old {
  opacity: 0.4;                     /* Äldre meddelanden bleknar */
}

.ai-message--latest {
  opacity: 1;
  color: var(--fg-soft);            /* Lite starkare */
}
```

**Regler:**
- Max 4 synliga meddelanden per slide (äldre scroll-fade:as ut uppåt)
- Aldrig i en bubbla, aldrig med avatar, aldrig med "AI:"-prefix
- Aldrig mer än en rad per meddelande
- Tone: kort, aktiv, lite varm ("Hittade logotyp och 6 färger" inte "Vi har identifierat 6 distinkta färger")

---

## Slide-transitions — teknisk spec

### Framer Motion variants

```typescript
const slideVariants = {
  enter: {
    opacity: 0,
    y: 30,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.99,
    transition: { duration: 0.25 }
  },
};
```

### Mellan-slide AI-meddelande

Vid vissa transitions (brand → editor) visas ett kort mellanmeddelande UNDER transition:

```
Brand card fade out → 
  [200ms] Tom vy med "Bra! Nu bygger vi er annons" (centrerat, fade in) →
  [800ms] Meddelandet synligt →
  Editor slide in
```

```typescript
async function transitionWithMessage(message: string, nextStep: Step) {
  setStep(null);                           // Fade out current
  await sleep(200);
  setTransitionMessage(message);           // Visa meddelande
  await sleep(800);
  setTransitionMessage(null);
  setStep(nextStep);                       // Fade in next
}
```

---

## Brand Card — kompakt grid-layout (måste passa 100vh)

### Datastruktur (oförändrad från v2)

```typescript
interface BrandProfile {
  name: string;
  url: string;
  description: string;
  logo: { url: string; source: string; confidence: number };
  favicon: { url: string; size: string };
  colors: { palette: Array<{ hex: string; role: string; confidence: number }> };
  fonts: {
    heading: { name: string; category: string };
    body: { name: string; category: string };
  };
  industry: { name: string; sniCode?: string; icon: string };
  location: { city: string; country: string };
  voice: {
    tone: string; addressing: string; register: string;
    language: string; exampleCopy: string;
  };
  targetAudience: { demographic: string; interests: string[]; geography: string };
  companyData?: {
    orgNr: string; officialName: string; employees: string;
    revenue: string; ceo: string; creditRating: string;
  };
  googlePlaces?: { rating: number; reviewCount: number; category: string };
  confidence: { overall: number; perField: Record<string, number> };
  analyzedAt: string;
}
```

### Compact grid (420px total height)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ROW 1: Header (56px)                                       │
│  ┌──────┐  IDA WARG Beauty                                  │
│  │ LOGO │  idawargbeauty.se · 💄 Skönhet · 📍 Stockholm    │
│  └──────┘                                                    │
│                                                             │
│  ROW 2: Visuellt (100px)                                    │
│  ┌─ Färger ──────────────┐ ┌─ Typsnitt ─────────────────┐  │
│  │ ██ ██ ██ ██ ██        │ │ Heading: Century Gothic     │  │
│  │ Pri Sek Acc Bg Txt    │ │ Body: Inter                 │  │
│  └───────────────────────┘ └─────────────────────────────┘  │
│                                                             │
│  ROW 3: Kommunikation (80px)                                │
│  ┌─ Tonalitet ──────────────────────────────────────────┐   │
│  │ 🗣 Du-tilltal · Varm, feminin, premium · Svenska      │   │
│  │ "Hej du! Upptäck vår nya kollektion av vegansk..."    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ROW 4: Data (100px)                                        │
│  ┌─ Målgrupp ────────────┐ ┌─ Företag ──────────────────┐  │
│  │ Kvinnor 18-35         │ │ 559XXX · 5-10 anst.        │  │
│  │ Skönhet, hudvård      │ │ 2-5 MSEK · VD: Ida Warg   │  │
│  │ Stockholm + online    │ │ Kreditbetyg: A             │  │
│  └───────────────────────┘ └─────────────────────────────┘  │
│                                                             │
│  ROW 5: Logo + Favicon (56px) — liten strip                │
│  │ [logo-thumb] 400×120 PNG  │  [fav] 32×32  │ [Byt ↑]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                                    ~392px total
```

**Responsivitet:** På mobil (< 640px) → single-column layout. Rows 2 och 4 stackar vertikalt. Brand card tar upp mer höjd men viewport-höjden på mobil är typiskt 660-700px → fortfarande ryms med CTA.

---

## Premium lockbeten i editorn (oförändrad strategi)

| Funktion | Trigger | Vad händer |
|----------|---------|------------|
| 🔒 AI-förbättra ✨ | Klick på ✨ | Pro-modal |
| 🔒 Variant B | Klick på B-tab | Pro-modal |
| 🔒 Fler format | Klick på FB/Google-tab | Pro-modal |
| 🔒 Ny bakgrundsbild ↻ | Klick på ↻ | Pro-modal |
| 🔒 Ladda ner PNG | Klick på 📥 | Pro-modal |
| 🔒 Dela preview | Klick på 🔗 | Pro-modal |
| 🔒 AI-strategi | Klick på blurrad text | Pro-modal |

**Pro-modal:** Renderas som en overlay INOM samma slide (inte en ny slide). Stängs med X eller Escape. Viewport-regeln gäller fortfarande — modalen tar aldrig mer än viewporten.

---

## LLM-kvalitetskrav (oförändrade)

### Brand-analys: Claude Sonnet, multimodalt
- Screenshot + markdown (3 sidor) + Roaring + Google Places
- ALLT i ett anrop: identitet, visuellt, tonalitet, språk, målgrupp, bransch
- Output: strukturerad JSON med confidence per dimension

### Annonsgenerering: Claude Sonnet
- Senior copywriter-nivå
- Headline max 40 tecken, body max 125, CTA matchat mot mål
- Tonalitet exakt matchad mot brand voice
- Bransch-specifika best practices

### Bildgenerering: GPT-image
- Brand-anpassad prompt med color grading
- Produktkategori + visuell stil + målgrupp
- Ingen text i bilden
- 1080×1080 (feed), 1080×1920 (stories)

---

## Implementation — komplett rivnings- och bygglista

### RIVS

```
components/ChatView.tsx
components/AssistantMessage.tsx
components/UserBubble.tsx
components/widgets/SuggestionChips.tsx
components/widgets/ConfirmationCard.tsx
components/AiAvatar.tsx
hooks/useCampaignState.ts              (om chat-coupled)
tools/definitions.ts
tools/executor.ts
tools/system-prompt.ts
app/api/chat/route.ts
prompts/campaign-chat.md
WIDGET_MAP, handleSuggestionClick, handleConfirm, append(), useChat
```

### NYTT

```
# Slide-system
components/onboarding/OnboardingShell.tsx     ← 100vh container + AnimatePresence
components/onboarding/URLSlide.tsx            ← Slide 1
components/onboarding/LoadingSlide.tsx        ← Slide 2
components/onboarding/BrandSlide.tsx          ← Slide 3
components/onboarding/AIMessage.tsx           ← Reusable AI-meddelande komponent

# Editor (också en slide, men återanvänds i dashboard)
components/editor/EditorSlide.tsx             ← Slide 4 (onboarding) + /dashboard/create
components/editor/AdPreviewFrame.tsx
components/editor/PublishSlide.tsx            ← Slide 5
components/editor/OAuthSlide.tsx             ← Slide 4.5 (om behövs)
components/editor/DoneSlide.tsx              ← Slide 6
components/editor/ProGate.tsx
components/editor/ProModal.tsx

# Dashboard (separata sidor, inte slides)
components/dashboard/CampaignList.tsx
components/dashboard/QuickStats.tsx
components/dashboard/InsightCards.tsx
components/dashboard/BrandProfile.tsx

# API Routes
app/api/brand/analyze/route.ts
app/api/brand/analyze/stream/route.ts         ← SSE
app/api/brand/profile/route.ts
app/api/ad/generate/route.ts
app/api/ad/image/route.ts
app/api/publish/route.ts
app/api/insights/generate/route.ts
app/api/campaigns/route.ts

# Prompts
prompts/brand-analysis.ts
prompts/ad-generation.ts
prompts/insight-generation.ts
```

### BEHÅLLS

```
All CSS / Tailwind config
Sidebar.tsx (uppdatera länkar)
layout.tsx
lib/supabase.ts
lib/meta-ads.ts
lib/google-ads.ts
lib/claude.ts
types/index.ts (utökas)
```

---

## Sammanfattning

| Aspekt | Beslut |
|--------|--------|
| **Chat** | Borta. Överallt. |
| **Scroll** | Aldrig. Varje steg = 100vh. |
| **AI-känsla** | Animerade mikro-meddelanden, inte chatbubblor |
| **Transitions** | Framer Motion slide-variants, 300-400ms |
| **Brand card** | Kompakt 2-kolumns grid, ~400px höjd |
| **Editor** | Skalbar mockup (max 45vh), toolbar + actions |
| **Publish** | Egen slide, slide-to-confirm |
| **Dashboard** | Standard SaaS UI (tillåter scroll) |
| **LLM** | Maxad — Sonnet multimodal + GPT-image |
| **Premium** | 🔒-features i editor driver Pro-konvertering |
| **Design** | Behålls — bara prompt-box placeholder ändras |
