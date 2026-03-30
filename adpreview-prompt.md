# AdPreview — Claude Code Prompt

Förbättra AdPreview-komponenten i detta projekt.

## Uppgift
Hitta AdPreview-komponenten (leta i components/, features/, ui/ eller liknande mappar).
Läs igenom den befintliga koden och förstå props-interfacet fullt ut innan du ändrar något.
Refaktorera sedan komponenten så att den ser ut och beter sig som en professionell,
visuellt imponerande annonsförhandsvisning med AI-genererade bakgrunder och inline-redigering.

---

## AI-genererad bakgrund via gpt-image-1

Varje annons ska ha en AI-genererad bakgrundsbild skapad av OpenAI:s gpt-image-1-modell.

**Endpoint**
```
POST https://api.openai.com/v1/images/generations
{
  "model": "gpt-image-1",
  "prompt": "<genererad prompt — se nedan>",
  "size": "1024x1024",   // Feed
  "size": "1024x1792",   // Stories (9:16)
  "size": "1792x1024",   // Display (landskap)
  "quality": "high",
  "n": 1
}
```

API-nyckeln läses från miljövariabeln `OPENAI_API_KEY` via en server action eller
API-route — exponera den aldrig i klienten.

**Prompt-generering**
Bygg bildprompt dynamiskt utifrån annonsens innehåll:
- Extrahera bransch, känsla och nyckelord från headline + primärtext
- Kombinera med ett fast suffix för konsekvent estetik:
  `"...cinematic lighting, ultra-sharp product photography, editorial quality,
  8K resolution, no text, no logos, no people unless specified"`
- Skicka prompten till ett lätt LLM-anrop (eller bygg den deterministiskt) —
  hårdkoda inget

**Regenerering**
- Visa en "Ny bakgrund"-knapp (cirkulär pil-ikon) i förhandsvisningens övre högra hörn
- Knappen genererar ny bild med samma prompt men ny seed
- Animera övergången med en crossfade (opacity 0→1, 300ms)
- Visa loading-spinner inuti knappen under generering
- Cacha senaste 3 genererade bilder per annons-ID i komponentens lokala state
  så användaren kan bläddra tillbaka

**Placering**
- Meta Feed / Stories / Display: bakgrunden täcker hela kreativ-ytan
- Google Search: ingen bakgrundsbild (plattformen renderar aldrig det)
- Google Display: bakgrunden är banners bakgrundslager bakom text och logotyp

---

## WOW-faktorn — visuell standard

Detta är det viktigaste kravet. Varje pixel ska utstråla kvalitet.

**Typografi**
- Headline: stor, luftig, tung vikt — skala efter formatets yta
- Subheadline / primärtext: subtilt, god radavstånd
- All text mot bild: alltid skyddad av gradient-overlay eller frosted glass-panel
- Ingen text utan läsbarhetsskydd mot bakgrunden

**Frosted glass**
Använd frosted glass-effekt (`backdrop-filter: blur(12px) saturate(180%)` +
semi-transparent vit eller mörk bakgrund) för:
- CTA-knappar
- Textpaneler som ligger över bakgrundsbilden
- Meta Stories: nedre textzon
- Google Display: textblock

**Depth och lager**
Bygg upp varje format i tydliga lager (bottom → top):
1. AI-genererad bakgrundsbild
2. Gradient-overlay (anpassad per format)
3. Frosted glass-panel eller textyta
4. Text (headline, body)
5. CTA-knapp
6. Plattformsspecifika UI-element (badge, profilbild, progress bar)

**Animationer**
- Entrance: hela preview-kortet glider in med `translateY(8px) → 0` + `opacity 0→1`
  när det renderas, 350ms ease-out
- Hover på preview-kortet: svag `scale(1.01)` + box-shadow förstärks, 200ms
- CTA-knapp: `scale(0.97)` vid klick, fjädrande återgång
- Bakgrundsbilden: subtle Ken Burns-effekt (`scale(1.0) → scale(1.04)`) loopas
  i 8s — ger liv utan att distrahera

**Google Search — WOW utan bild**
Eftersom Search inte har bakgrundsbild, kompensera med:
- Exakt pixel-perfekt kopia av Googles sökresultatsida
- Animerad blinkande textmarkör i slutet av headline vid hover
- Mjuk pulse-animation på Ad-badge
- Sitelinks renderade som klickbara chips med hover-state

---

## Inline-redigering i preview

Alla textfält ska kunna redigeras direkt i förhandsvisningen — ingen separat modal.

**Trigger**
- Klick på ett textelement → fältet övergår till redigerbart läge
- Markera fältet med en tunn accent-border och mjuk bakgrundsfärg
- Visa en liten "redigerar"-indikator (penna-ikon) till höger om fältet

**Redigerbara fält per format**
- Meta Feed: headline, primärtext, CTA-knapptext
- Meta Stories: headline, subheadline, CTA-text
- Google Search: headline (del 1–3 individuellt), beskrivning (rad 1–2), display-URL
- Google Display: headline, subheadline, CTA-text

**Beteende**
- `contenteditable` med `plaintext-only` — ingen HTML-inmatning
- Teckenbegränsning enforced live med en räknare (t.ex. "28/30")
- Enter sparar och avslutar redigering, Escape avbryter och återställer ursprungsvärdet
- Tab hoppar till nästa redigerbara fält i logisk ordning
- Ändringar propageras omedelbart upp via `onChange`-callback i props

**Undo**
- Behåll en undo-stack (max 20 steg) per redigeringssession
- `Cmd/Ctrl+Z` ångrar senaste ändring inuti preview
- Visa en diskret "Ångrade" toast i 1,5s

**Spara-indikator**
- Visa en "Osparade ändringar"-badge i komponentens övre kant när lokalt state
  skiljer sig från ursprungliga props
- Badge försvinner efter att `onSave`-callback anropats eller vid discard

---

## Plattformens spec-varningar

Varje redigerbart fält ska valideras live mot plattformens officiella gränser.
Visa aldrig bara en räknare — förklara konsekvensen om gränsen överskrids.

**Exakta gränser**

Google Search:
- Headline (per del): max 30 tecken
- Beskrivning (per rad): max 90 tecken
- Display-URL path: max 15 tecken per del

Meta Feed / Stories:
- Primärtext: max 125 tecken (över detta trunkeras i flödet utan att visas)
- Headline: max 40 tecken
- Beskrivning: max 30 tecken
- CTA-text: fördefinierade val, inget fritext

Google Display:
- Headline: max 30 tecken
- Subheadline: max 90 tecken

**Varningsnivåer**
Implementera tre nivåer per fält:

1. OK (under 80% av gränsen) — räknaren visas i neutralt läge, ingen störning
2. Varning (80–99%) — räknaren byter till amber, fältet får en tunn
   amber-border, ingen blockering
3. Fel (100% eller över) — räknaren röd, fältet får röd border, och en
   tooltip eller inline-banner visas med exakt förklaring:

   Exempel Google headline:
   "Googles gräns är 30 tecken per rubrikdel. Annonser som överskrider
   gränsen avvisas automatiskt vid publicering."

   Exempel Meta primärtext:
   "Meta trunkerar primärtext efter 125 tecken i flödet. Resten av texten
   visas bara om användaren klickar 'se mer' — de flesta gör det inte."

**Förklaring ska alltid synas**
Visa inte bara röd färg. Varje felnivå ska ha en kort, konkret mening
som förklarar vad som faktiskt händer med annonsen — inte bara "för långt".
Texten ska vara på samma språk som projektet i övrigt.

**Sammanfattningspanel**
Visa en liten spec-status-rad under format-switcher:
- Grön bock om alla fält är inom gränserna
- Gult utropstecken + antal fält i varningszonen
- Rött kryss + "Annonsen kan avvisas" om något fält är över gräns
Klick på raden scrollar till det första problematiska fältet.

---

## A/B-variantjämförelse

Komponenten ska stödja två parallella annons-varianter (A och B) som kan
genereras, redigeras och jämföras mot varandra.

**Tillstånd**
Håll state för två kompletta AdData-objekt: `variantA` och `variantB`.
Variant B är initialt tom. Lägg till följande i props-interfacet:

```ts
variantB?: AdData
onVariantBChange?: (updated: AdData) => void
defaultCompareMode?: 'toggle' | 'sidebyside'
```

**Toggle-läge (standard)**
- En pill-switcher ovanför preview: `A | B`
- Aktivt variant markerat, inaktivt nedtonat
- Byte mellan A och B animeras med en crossfade (opacity, 200ms)
- Variant B genererar sin egen AI-bakgrundsbild separat från A
- Knappen "Generera variant B" skapar en kopia av A:s content som
  startpunkt — användaren redigerar därifrån

**Side-by-side-läge**
- Knapp "Jämför sida vid sida" i åtgärdsraden
- Båda varianterna renderas bredvid varandra, skalade till ~50% bredd
- Klick på ett format i side-by-side expanderar det till full preview
- På skärmar under 768px: stapla vertikalt istället för horisontellt

**Diff-markering**
I side-by-side-läge: markera fält som skiljer sig mellan A och B
med en tunn accent-border och en subtil bakgrundsfärg.
Hovra över ett markerat fält för att se båda versionernas text i en tooltip.

**Vinnare-markering**
Lägg till en "Välj vinnare"-knapp per variant i side-by-side-läge.
När användaren klickar propageras valet via `onWinnerSelected('A' | 'B')`-callback.
Den valda varianten markeras med en grön "Vald"-badge.
Ingen logik för statistik behövs nu — det är ett visuellt val.

**Spec-varningar per variant**
Spec-status-panelen visas separat för A och B i side-by-side-läge,
så användaren ser om en variant har fler problem än den andra.

---

## Format som ska stödjas

### Meta Feed
- Kortlayout med profilbild, sidnamn och "Sponsrat"-badge överst
- Kreativ yta med korrekt aspect ratio (1:1 eller 4:5) — AI-bakgrund här
- Primärtext nedanför med trunkering efter 3 rader + "...mer"-expandering
- Frosted glass CTA-knapp i plattformens stil längst ner
- Statisk reaktionsrad i botten (gilla, kommentera, dela)

### Meta Stories
- 9:16 aspect ratio (helskärm vertikalt) — AI-bakgrund täcker allt
- Mörk gradient-overlay i nederkant
- Varumärkesnamn + profilbild uppe till vänster
- Progress bar-simulering överst
- Frosted glass "Svep upp"-CTA längst ner

### Google Search
- Pixel-perfekt Google-sökresultatsutseende
- "Ad"-badge, grön URL-rad, blå rubrik, grå beskrivning
- Upp till 3 rubriker separerade med "|", upp till 2 beskrivningsrader
- Sitelinks som chip-rader om data finns

### Google Display
- Bannerformat — välj rätt storlek baserat på data (728×90, 300×250 eller 160×600)
- AI-bakgrund som bakgrundslager
- Frosted glass textblock med logotyp, headline, subheadline och CTA

---

## UX-krav

**Format-switcher**
Pill- eller tab-rad överst med: `Meta Feed | Meta Stories | Google Search | Google Display`
Markera aktivt format. Stil konsekvent med projektets befintliga komponentbibliotek.

**Skeleton loader**
Animerat skeleton-tillstånd medan bakgrundsbild genereras och content laddas.
Skeletonets proportioner matchar det valda formatets slutliga layout — ingen layout-shift.

**Platshållare**
Om bild ännu inte genererats: rendera en platshållare med korrekt aspect ratio,
centrerad ikon och en neutral bakgrundsfärg. Starta bildhämtning parallellt.

**Åtgärdsrad**
Nedanför varje preview — fyra knappar:
- "Ny bakgrund" — genererar ny AI-bild (även tillgänglig som ikon i preview-hörnet)
- "Redigera" — toggle-knapp som sätter alla fält i redigeringsläge simultant
- "Kopiera text" — kopierar synlig annonstext till clipboard med visuell feedback
- "Exportera" — placeholder tills vidare

---

## Container och skalning — ingen scrollning

Hela AdPreview-komponenten ska leva inuti en fast, rundad container
(liknande en stor kortram med kraftig border-radius). Följande regler gäller utan undantag:

**Ingen scrollning**
Varken horisontellt eller vertikalt scroll får uppstå — varken inuti komponenten
eller på sidan på grund av komponenten. Allt innehåll måste alltid rymmas inom
containerns synliga yta.

**Dynamisk skalning**
Alla inre element — preview-kortet, typografi, knappar, åtgärdsrad — ska
skalas proportionellt med containerns tillgängliga yta.
Använd CSS `scale()` eller `zoom` kombinerat med en wrapping-div med känd bredd/höjd
för att hålla allt i proportion oavsett skärmstorlek.
Aldrig hårdkodade pixelvärden på höjd — använd `aspect-ratio` + `width: 100%`
så att höjden alltid följer bredden.

**Container-specifikation**
- Kraftig border-radius (minst 20px, gärna 28px)
- Tydlig border (1.5–2px, neutral färg från designsystemet)
- Padding inuti containern: minst 24px på alla sidor
- Containern fyller tillgängligt utrymme i sin parent men växer aldrig
  utanför viewport-höjden
- Använd `max-height: calc(100vh - [höjd på header + input-rad])` och
  `overflow: hidden` på containern — aldrig `overflow: auto` eller `scroll`

**Preview-kortets storlek**
Preview-kortet (det faktiska annonskortet) centreras inuti containern.
Om kortets naturliga storlek är större än containerns inre yta:
skala ner med `transform: scale(factor)` där factor räknas ut i JS som
`min(containerWidth / cardNaturalWidth, containerHeight / cardNaturalHeight)`.
Aldrig beskär innehåll — alltid skala ner proportionellt.

---

## Header-stil

Komponenten ska ha en header ovanför format-switcher som följer detta mönster:

**Layout**
- Liten ikon till vänster: rund eller squircle-form, gradient eller accent-färg
  från designsystemet, med en sparkle- eller stjärn-ikon inuti (symboliserar AI)
- Bredvid ikonen: två textrader
  - Rad 1: komponentens rubrik (t.ex. "Annonsförslag") — tyngre vikt, normal storlek
  - Rad 2: subtitle (t.ex. "Välj format och variant") — ljusare, muted färg, mindre storlek
- Header-raden är subtilt separerad från format-switcher nedanför (tunn divider
  eller bara generöst whitespace — ingen box eller bakgrundsfärg)

**Format-switcher direkt under headern**
Format-tabbar renderas som pills eller knappar med plattformslogotyper:
- Instagram-ikon + "Instagram Post"
- Facebook-ikon + "Facebook Annons"
- Google-ikon + "Google Search"
- Google-ikon + "Google Display"
Använd officiella plattformsfärger på ikonerna (hårdkoda dessa — de är
varumärkesneutrala, inte projektets egna färger).
Aktivt format: vit/ljus pill med lätt bakgrundsfärg. Inaktivt: transparent.

**Proportioner**
Header + switcher ska tillsammans aldrig ta mer än ~20% av containerns höjd.
Resten av utrymmet tillhör preview-kortet.

---

## Teknisk standard

**Arkitektur**
Dela upp i:
- `AdPreviewMeta.tsx` (Feed + Stories)
- `AdPreviewGoogle.tsx` (Search + Display)
- `AdPreviewSwitcher.tsx` (format-tab-logik)
- `AdPreview.tsx` (sammansatt entry-point)
- `useAdImageGeneration.ts` (custom hook — hanterar API-anrop, cache, loading-state)
- `useAdEditor.ts` (custom hook — hanterar redigeringsstate, undo-stack, change-tracking)
- `useAdValidation.ts` (custom hook — hanterar spec-validering per plattform och fält)

**Props-interface**
Behåll befintligt interface. Lägg till:
```ts
variantB?: AdData
onVariantBChange?: (updated: AdData) => void
onWinnerSelected?: (winner: 'A' | 'B') => void
onSave?: (updatedAd: AdData) => void
onImageGenerated?: (imageUrl: string, format: AdFormat) => void
defaultCompareMode?: 'toggle' | 'sidebyside'
editable?: boolean          // default: true
autoGenerateImage?: boolean // default: true
```

**Responsivitet**
- Max bredd 480px, centrerad
- Meta Stories scrollar horisontellt på skärmar smalare än 390px
- Google Search skalas proportionellt — ingen overflow
- Side-by-side A/B staplas vertikalt under 768px

**Tillgänglighet**
- Alla interaktiva element har `aria-label`
- Fokushantering fungerar vid format-byte via tangentbord
- Skeleton har `aria-busy="true"` och `role="status"`
- `contenteditable`-fält har `role="textbox"` och `aria-label` med fältnamn
- Spec-varningar annonseras till skärmläsare via `aria-live="polite"`

**Image CDN med transformationer**
Servera aldrig AI-genererade bilder direkt från OpenAI:s URL — de är temporära och saknar cachning.
Ladda upp varje genererad bild till Vercel Blob eller Cloudflare Images direkt efter generering
och servera alltid från CDN-URL:en istället.

Konfigurera automatiska transformationer per annonsformat:
- Meta Feed (1:1): `?w=1080&h=1080&fit=cover&f=webp`
- Meta Stories (9:16): `?w=1080&h=1920&fit=cover&f=webp`
- Google Display (728×90): `?w=1456&h=180&fit=cover&f=webp` (2x för retina)

Använd Next.js `<Image>`-komponenten med `sizes`-prop kalibrerad per format.
Mål: bilderna ska vara fullt laddade innan preview-kortet animeras in.
Sätt `priority`-flaggan på det aktiva formatets bild, lazy-ladda övriga.

**Komponent-isolering via iframe**
Rendera det faktiska annonskortet (inte hela AdPreview-komponenten, bara kortets inre yta)
i en sandboxad iframe med `sandbox="allow-scripts"`.

Fördelar som detta ger direkt:
- Noll CSS-läckage in eller ut — annonskortet ser identiskt ut oavsett projektets globala styles
- Möjliggör "Embed på kundens sajt"-funktionen utan extra arkitektur
- Google Search-formatet kan imitera Googles exakta typografi och färger utan att projektets
  CSS-reset skriver över dem

Kommunikation mellan iframe och parent sker via `postMessage`.
Håll iframe-innehållet som en separat minimal HTML-template per format.
Rita aldrig komponentens interaktiva skal (switcher, header, knappar) inuti iframe — bara kortets yta.

**Server Components för initial render**
Dela upp AdPreview i ett tydligt server/klient-gränssnitt:

Server Component (ingen hydration):
- Annonsens metadata (format, fält, plattformsgränser)
- Initialt skeleton med korrekta proportioner
- Statisk header och format-switcher-struktur

Client Component (hydreras):
- Inline-redigering och all state
- Animationer och Ken Burns
- A/B-switcher och interaktioner
- Bildgenererings-trigger och loading-states

Märk klient-komponenter explicit med `'use client'` och håll dem så små som möjligt.
Det statiska skalet ska vara synligt och korrekt dimensionerat redan vid FCP —
användaren ska aldrig se ett tomt utrymme medan JS laddas.

**Felhantering**
- Om bildgenerering misslyckas: visa platshållare + retry-knapp, krascha inte
- Om obligatoriskt textfält saknas: rendera error-state med förklarande text
- Om `OPENAI_API_KEY` saknas: logga tydligt server-side, visa neutral platshållare client-side
- Om ett fält överskrider plattformsgräns: blockera inte — varna tydligt och låt användaren bestämma

**Feltelemetri och observability**
Installera och konfigurera Sentry för fel-tracking från dag ett — inte som ett efterarbete.

Sentry-integration:
- Initiera Sentry i både server-side (`instrumentation.ts`) och client-side (`sentry.client.config.ts`)
- Fånga alla fel i bildgenererings-pipeline med full kontext: vilket format, vilken prompt,
  vilket OpenAI-felmeddelande — aldrig bara "något gick fel"
- Fånga render-fel i AdPreview via en React Error Boundary som rapporterar till Sentry
  och visar ett graciöst fallback-UI för användaren
- Tagga varje Sentry-event med `format` (feed/stories/search/display), `variant` (A/B)
  och `step` (generate/edit/export) så felen är sökbara och grupperingsbara

Produktanalytik med PostHog:
Lägg till PostHog och tracka följande händelser utan undantag:

```ts
posthog.capture('url_submitted', { url, industry_detected })
posthog.capture('ad_generated', { format, duration_ms, model_used })
posthog.capture('image_generated', { format, prompt_length, duration_ms })
posthog.capture('background_regenerated', { format, attempt_number })
posthog.capture('inline_edit_started', { format, field })
posthog.capture('spec_warning_triggered', { platform, field, character_count })
posthog.capture('variant_b_created')
posthog.capture('ab_compare_opened', { mode }) // toggle | sidebyside
posthog.capture('winner_selected', { winner }) // A | B
posthog.capture('copy_text_clicked', { format })
posthog.capture('export_clicked', { format })
```

Dessa events avslöjar exakt var i flödet folk faller av, vilka format som används mest
och om spec-varningarna faktiskt triggas i verkligheten.
Lägg alla PostHog-anrop i en dedikerad `useAnalytics.ts`-hook så de är lätta att hitta,
uppdatera och mocka i tester.

---

## Arbetssätt

1. Läs befintlig komponent och kartlägg props-interfacet
2. Läs BRIEF.md, README eller motsvarande för projektkontext och designtokens
3. Presentera en kort plan — vilka filer skapas/ändras och i vilken ordning
4. Invänta godkännande innan implementation
5. Implementera i denna ordning:
   a. `useAdValidation.ts` (spec-regler för alla plattformar)
   b. `useAdImageGeneration.ts` + server action/API-route
   c. `useAdEditor.ts` (redigeringsstate + undo-stack)
   d. `useAnalytics.ts` (PostHog-wrapper för alla trackade events)
   e. Meta Feed (med bild + inline-edit + validering)
   f. Meta Stories
   g. Google Search
   h. Google Display
   i. A/B-switcher + side-by-side-läge
   j. Sammansatt `AdPreview.tsx` + `AdPreviewSwitcher.tsx`
   k. Sentry Error Boundary runt hela komponenten
6. Skriv korta kommentarer på engelska vid varje logikblock

Gör inga antaganden om filstruktur — leta upp allt innan du skriver kod.
