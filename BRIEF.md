# BRIEF.md — Doost AI

## Vad är Doost AI?
AI-driven annonsplattform för svenska SMEs. Användaren klistrar in sin URL →
vi analyserar varumärket → genererar en annons → de publicerar.

## Tech stack
- Next.js 15 (App Router)
- Supabase (auth, DB, storage)
- Tailwind CSS + shadcn/ui
- Framer Motion (animationer)
- TypeScript (strict mode)
- Vercel AI SDK (backend tool calls only — NOT chat mode)
- Drizzle ORM
- Clerk (auth)

## Arkitektur — KRITISKA REGLER
1. INGEN CHAT. Ingen useChat, inga chatbubblor, inget Vercel AI SDK chat-mode.
2. INGEN SCROLL i onboarding. Varje steg = 100vh, overflow hidden.
3. AI-känsla via animerade mikro-meddelanden (AIMessage-komponent), INTE bubblor.
4. Slide-transitions via Framer Motion AnimatePresence.

## ⚠️ DESIGN-LAG — LÄS DETTA FÖRST
DESIGNEN FÅR INTE ÄNDRAS. Innan du skapar en ny komponent:
1. Sök i hela kodbasen efter befintliga komponenter med liknande funktion
2. Kopiera EXAKT samma Tailwind-klasser, CSS-variabler, border-radius, padding, färger
3. Återanvänd befintliga komponenter där det går — wrappa dem, ändra inte deras styling
4. Om du behöver en knapp → hitta en befintlig knapp i koden och kopiera dess klasser
5. Om du behöver ett input-fält → hitta det befintliga chat-inputfältet och kopiera exakt
6. Om du behöver ett kort → hitta befintliga kort/cards och kopiera exakt
7. ALDRIG hitta på nya färger, border-radius, font-sizes, shadows, eller spacing
8. Alla designtokens finns redan i koden — använd dem, skapa inga nya

Referensfiler för befintlig design (granska dessa före varje fas):
- Se ./DESIGN_REFERENCE.md (skapas i Fas 0.5)

## Onboarding-flöde (6 slides)
1. URLSlide — EXAKT samma runda prompt-box som befintlig chat-input
2. LoadingSlide — progressiv reveal med AI-meddelanden
3. BrandSlide — kompakt brand card
4. EditorSlide — annonsredigerare
5. PublishSlide — budget/tid/region + slide-to-confirm
6. DoneSlide — bekräftelse + redirect

## Fil att läsa för detaljer
./SPEC.md — fullständig spec med wireframes och datastrukturer
./DESIGN_REFERENCE.md — dokumenterad befintlig design (klasser, tokens, komponenter)
