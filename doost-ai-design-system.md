# Doost AI — Card & onboarding design system

> **Version 1.0 — April 2026**
> Super prompt for designers and developers. Use this document as context when building with Claude Code.

---

## 1. Design philosophy and principles

Doost AI is a campaign builder for SME companies. Users are small business owners, marketing managers, and entrepreneurs who may not be experienced advertisers. Every design decision must reduce cognitive load, build confidence, and deliver value within 3 minutes of first interaction.

### Principle 1: Show, don't tell
Display actual color swatches instead of hex codes. Render font names in their actual typeface. Show miniature logos instead of file names. The brand card should feel like a mini brand book, not a data form.

### Principle 2: One primary action per card
Every card has exactly one primary CTA. Brand card = "Confirm brand." Ad card = "Publish." Budget card = "Continue." Everything else is secondary. This eliminates decision paralysis for SME users.

### Principle 3: Progressive confidence over aggregate scoring
Never show a single low percentage (e.g. "48% match"). Instead, show itemized detection results: "Logo: Found. Colors: 4 detected. Fonts: Could not detect — add manually." Itemized results make even partial detection feel productive.

### Principle 4: Inline editability everywhere
Every field on every card should be editable with a single tap. No separate edit screens. No modals for simple changes. Click the font name to change it. Click a color swatch to swap it.

### Principle 5: Platform-aware previews
Never show a generic ad mockup. Always frame ads in the platform's native UI (Instagram story frame, Google search result format, LinkedIn feed card).

### Principle 6: Sub-3-minute time-to-value
The entire onboarding flow (URL input to published campaign) must complete in under 3 minutes. Doost uses exactly 6 steps.

### Principle 7: Bento grid for information density
Use modular, asymmetric card grids (bento layout) to group related information visually. Colors + fonts cluster together. Industry + audience cluster together.

---

## 2. Design tokens and foundations

### Color palette

```
--bg-page:        #FAFAF9   /* Page background, light warm gray */
--bg-card:        #FFFFFF   /* Card backgrounds */
--bg-surface:     #F4F3F0   /* Bento cells, input backgrounds, secondary surfaces */
--border-default: #E8E6E1   /* Card borders, dividers (1.5px solid) */
--border-light:   #F0EEE9   /* Internal dividers, section separators */
--text-primary:   #1A1A18   /* Headings, primary text, CTA buttons */
--text-secondary: #6B6A66   /* Body text, descriptions */
--text-hint:      #9C9A92   /* Labels, placeholders, metadata */
--accent:         #2563EB   /* Primary accent: links, active states, selected items */
--accent-light:   #EFF6FF   /* Accent backgrounds: selected chips, info banners */
--accent-border:  #BFDBFE   /* Accent borders: selected chips, active cards */
--success:        #059669   /* Positive states: high scores, confirmations */
--success-light:  #ECFDF5   /* Success backgrounds */
--success-border: #A7F3D0   /* Success borders */
--warning:        #D97706   /* Caution states: medium scores, budget confirmations */
--warning-light:  #FFFBEB   /* Warning backgrounds */
--warning-border: #FDE68A   /* Warning borders */
--danger:         #DC2626   /* Error states, low scores, destructive actions */
--danger-light:   #FEF2F2   /* Error backgrounds */
```

### Tailwind config extension

```js
// tailwind.config.js — extend theme with Doost tokens
module.exports = {
  theme: {
    extend: {
      colors: {
        page: '#FAFAF9',
        card: '#FFFFFF',
        surface: '#F4F3F0',
        border: { DEFAULT: '#E8E6E1', light: '#F0EEE9' },
        text: { primary: '#1A1A18', secondary: '#6B6A66', hint: '#9C9A92' },
        accent: { DEFAULT: '#2563EB', light: '#EFF6FF', border: '#BFDBFE' },
        success: { DEFAULT: '#059669', light: '#ECFDF5', border: '#A7F3D0' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB', border: '#FDE68A' },
        danger: { DEFAULT: '#DC2626', light: '#FEF2F2' },
      },
      borderRadius: {
        card: '14px',
        cell: '10px',
        btn: '10px',
        pill: '20px',
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
};
```

### Typography

| Element | Size | Weight | Spacing | Notes |
|---------|------|--------|---------|-------|
| Page title | 28px | 700 | -0.02em | Used at top of each step |
| Card title | 20px | 700 | -0.01em | Card header names |
| Section label | 11px | 600 | 0.06em | Uppercase, color: --text-hint |
| Body text | 14–15px | 400 | normal | Line-height: 1.6 |
| Small text | 12–13px | 500 | normal | Descriptions, metadata |
| Pill / badge | 11–12px | 600 | 0.01em | Inside pill components |
| Metric number | 20–26px | 800 | -0.02em | KPI displays, budget amounts |

### Spacing and radius

| Token | Value | Usage |
|-------|-------|-------|
| Card border-radius | 14px | All card containers |
| Inner cell radius | 10px | Bento grid cells, inputs |
| Button radius | 10px | All buttons |
| Pill radius | 20px | Badges, tags, chips |
| Card padding | 20–24px | Outer card padding |
| Bento cell padding | 16px | Inner cell padding |
| Grid gap | 10px | Between bento cells |
| Section spacing | 24–32px | Between major sections |
| Card border | 1.5px solid --border-default | All card containers |
| Card shadow | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` | Default |
| Active card shadow | `0 0 0 3px var(--accent-light)` | Selected/active cards |

---

## 3. Component stack

### Install commands

```bash
# Foundation
npx shadcn@latest init
npx shadcn@latest add card slider badge tabs toggle-group dialog progress skeleton form hover-card switch button input

# Magic UI (BentoGrid, Confetti, Number Ticker, etc.)
npx shadcn@latest add "https://magicui.design/r/bento-grid"
npx shadcn@latest add "https://magicui.design/r/confetti"
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/shimmer-button"
npx shadcn@latest add "https://magicui.design/r/pulsating-button"
npx shadcn@latest add "https://magicui.design/r/animated-circular-progress-bar"
npx shadcn@latest add "https://magicui.design/r/blur-fade"

# Tremor (charts and data viz)
npm install @tremor/react

# Motion (animations)
npm install motion

# Additional
npm install react-colorful lucide-react date-fns
```

### Library-to-component mapping

| Library | Components used in Doost | Purpose |
|---------|------------------------|---------|
| shadcn/ui | Card, Slider, Badge, Tabs, Toggle Group, Dialog, Progress, Skeleton, Form, Hover Card, Switch, Button, Input, Sonner (toast) | Foundation: all forms, cards, layout primitives |
| Magic UI | BentoGrid, BentoCard, Confetti, Number Ticker, Animated Circular Progress, Shimmer Button, Pulsating Button, iPhone frame, Blur Fade, Border Beam | Layout (bento grid) and delight (celebrations, animations) |
| Tremor | AreaChart, ProgressBar, BadgeDelta, Tracker, DateRangePicker | Data visualization: budget charts, score bars |
| Motion | AnimatePresence, whileHover, whileTap, staggerChildren, layout | Animation engine: step transitions, card entrances |

---

## 4. Brand card specification

The brand card is the user's first "wow moment." AI-scraped data transforms into a visual identity summary.

### Layout structure (top to bottom)

```
┌─────────────────────────────────────────────────┐
│  [Logo 56px]  Brand Name          [92% match]   │  ← Header row
│               brand-url.se                       │
├─────────────────────────────────────────────────┤
│  BRAND COLORS                                    │  ← Full-width bento cell
│  [●] [●] [●] [●] [+]                           │    44px circles, 10px radius
│  #BC  #000 #6D6 #FFF                            │    Hex labels below
├────────────────────┬────────────────────────────┤
│  HEADING FONT      │  BODY FONT                 │  ← 2-column bento cells
│  Canon Sans        │  Canon Sans                │    Rendered in actual typeface
├────────────────────┬────────────────────────────┤
│  INDUSTRY          │  LOCATION                  │  ← 2-column bento cells
│  Photography       │  Stockholm                 │
├─────────────────────────────────────────────────┤
│  TARGET AUDIENCE                                 │  ← Full-width bento cell
│  Photographers, videographers, companies         │
├─────────────────────────────────────────────────┤
│  PUBLISH TO                                      │
│  [Meta ✓] [Google ✓] [LinkedIn]                 │  ← Toggle chips
├─────────────────────────────────────────────────┤
│  [ Confirm brand → ]  [ Edit details ]           │  ← Action footer
└─────────────────────────────────────────────────┘
```

### Match score indicator

| Score range | Color | Label | Pill class |
|-------------|-------|-------|------------|
| 85–100% | --success / --success-light | "Great match" | `bg-success-light text-success border-success-border` |
| 60–84% | --accent / --accent-light | "Good start" | `bg-accent-light text-accent border-accent-border` |
| Below 60% | --warning / --warning-light | "Help us improve" | `bg-warning-light text-warning border-warning-border` |

**CRITICAL:** Never use red/danger for the match score. Red signals error. Use amber/warning for low scores and frame them as opportunities.

### Inline editing behavior

- Every bento cell has a hover state: subtle border highlight + cursor: pointer
- Click text field → inline input appears with current value pre-filled
- Click color swatch → react-colorful picker appears as popover
- Click font name → dropdown with Google Fonts suggestions
- Platform chips → toggle on/off with tap. Selected: `bg-accent-light text-accent border-accent-border`
- All edits auto-save (no separate save button)

### Component implementation

```jsx
// Brand card uses Magic UI BentoGrid
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { HoverCard } from "@/components/ui/hover-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

// BentoGrid layout classes for the brand card:
// Color row:    className="col-span-2"         (full width)
// Heading font: className="col-span-1"         (left column)
// Body font:    className="col-span-1"         (right column)
// Industry:     className="col-span-1"         (left column)
// Location:     className="col-span-1"         (right column)
// Audience:     className="col-span-2"         (full width)
```

### States

- **Loading:** Skeleton shimmer on each bento cell (use shadcn Skeleton)
- **Default:** All fields populated, match score visible
- **Editing:** Active field has focus ring `ring-3 ring-accent-light`, other cells opacity-70
- **Error:** Individual field red underline + error message below

---

## 5. Ad preview card specification

The ad preview card shows AI-generated creatives with A/B comparison and creative scoring.

### Layout structure

```
┌─────────────────────────────────────────────────┐
│  [Instagram ●] [Google] [LinkedIn]              │  ← Platform tabs (pill style)
├─────────────────────┬───────────────────────────┤
│  ┌───────────────┐  │  ┌───────────────────┐    │
│  │ [Variant A]   │  │  │ [Variant B]       │    │
│  │        [84/100]│  │  │          [71/100] │    │
│  │               │  │  │                   │    │
│  │  [Ad Image]   │  │  │  [Ad Image]       │    │
│  │               │  │  │                   │    │
│  │  [Learn more] │  │  │  [Learn more]     │    │
│  ├───────────────┤  │  ├───────────────────┤    │
│  │ Headline text │  │  │ Headline text     │    │
│  │ Description   │  │  │ Description       │    │
│  └───────────────┘  │  └───────────────────┘    │
├─────────────────────┴───────────────────────────┤
│  DIFFERENCES BETWEEN A AND B                     │  ← Diff panel
│  [Headline] "precision" → removed                │
│  [Subtext] "free advice" → "free consultation"   │
├─────────────────────────────────────────────────┤
│  [ Continue with variant A → ]   [ ↻ Regenerate ]│
└─────────────────────────────────────────────────┘
```

### Creative scoring

| Score | Pill color | Meaning |
|-------|-----------|---------|
| 75–100 | `bg-success-light text-success` | High predicted performance |
| 50–74 | `bg-warning-light text-warning` | Moderate performance |
| Below 50 | `bg-danger-light text-danger` | Low performance, suggest edits |

Display format: "84/100" as a pill badge in top-right of each ad card. Below the card, a Tremor ProgressBar in matching color shows the score visually.

### Platform tabs

- Active tab: `bg-text-primary text-white rounded-pill px-4 py-2`
- Inactive tab: `bg-surface text-text-secondary rounded-pill px-4 py-2`
- When "Instagram" is active, wrap ad preview in Magic UI iPhone component
- When "Google" is active, show Google search result card frame
- When "LinkedIn" is active, show LinkedIn feed card frame

### Diff highlighting

Below the A/B cards, show a card with differences:
- Each changed element gets a pill tag (e.g. "Headline", "Subtext") in `bg-accent-light`
- Old text in strikethrough with `text-text-hint`
- New text in `text-accent font-semibold`

### Selection behavior

- Click a variant card to select it
- Selected: `border-accent border-[1.5px]` + `ring-3 ring-accent-light`
- Unselected: `border-border-default`
- CTA label updates: "Continue with variant A →" / "Continue with variant B →"

### Inline editing

- Hover headline → editable underline appears
- Hover ad image → overlay with "Swap image" button
- Hover CTA button → button text becomes editable
- "Regenerate" button → replaces both variants (show Skeleton loading)

---

## 6. Budget card specification

The budget card has the highest abandonment risk. The design must remove blank-field anxiety through presets and real-time feedback.

### Layout structure

```
┌─────────────────────────────────────────────────┐
│  ┌─────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ STARTER │  │[Best value]  │  │  GROWTH   │  │  ← 3-column preset tiers
│  │  50 kr  │  │ RECOMMENDED  │  │  300 kr   │  │
│  │  /day   │  │   150 kr     │  │   /day    │  │
│  │~1,200/d │  │    /day      │  │ ~9,800/d  │  │
│  └─────────┘  │  ~4,500/day  │  └───────────┘  │
│               └──────────────┘                   │
├─────────────────────────────────────────────────┤
│  CUSTOM BUDGET                  [Daily ● Total]  │
│  ═══════════════●═══════════    150 kr/day       │  ← Slider + value
├─────────────────────────────────────────────────┤
│  EST. REACH/MO   EST. CLICKS/MO   COST/CLICK   │  ← Live metric cells
│     4,500            420            10.7 kr      │
├─────────────────────────────────────────────────┤
│  ▐▌▐▐▌▌▐▐▐▌▌▐▐▌▐▌▌▐▐▐▌▌▐▐▌▐▌                  │  ← Mini 30-day bar chart
│  Day 1                          Day 30           │
├─────────────────────────────────────────────────┤
│  💡 Only pay for results. Change anytime.        │  ← Reassurance banner
├─────────────────────────────────────────────────┤
│  [ Continue to ad preview → ]                    │
└─────────────────────────────────────────────────┘
```

### Preset tier cards

| Tier | Daily amount | Estimated reach | Pre-selected? |
|------|-------------|-----------------|---------------|
| Starter | 50 kr | ~1,200/day | No |
| Recommended | 150 kr | ~4,500/day | YES (default) |
| Growth | 300 kr | ~9,800/day | No |

- Recommended tier has green "Best value" pill: `position: absolute; top: -10px; left: 50%; transform: translateX(-50%)`
- Selected tier: `border-accent border-[1.5px]` + `ring-3 ring-accent-light`
- Clicking a tier updates the slider to that value

### Custom slider

- Range: 20–500 kr, step: 10
- Slider thumb: 20px diameter, `bg-accent`, white 3px border, subtle shadow
- Track: 6px height, `bg-border-default`, accent color for filled portion
- Linked numeric display: 24px, weight 800
- Daily/Total toggle: small switch component on the right

### Real-time metrics (update live as slider moves)

```
Estimated monthly reach  = budget × 30           → toLocaleString()
Estimated monthly clicks = budget × 2.8          → Math.round()
Cost per click           = (budget × 30) / clicks → toFixed(1)
```

Use Magic UI Number Ticker for animated transitions when values change.

### Mini bar chart

- 30 vertical bars representing daily spend distribution
- Bar height = `Math.max(8, Math.min(56, (budget / 500) * 56 * (0.6 + Math.sin(i * 0.4) * 0.4)))`
- Color: accent with gradient opacity (22% to 66%)
- Transition: `height 0.3s ease`
- Labels below: "Day 1" (left) and "Day 30" (right)

### Reassurance banner

```jsx
<div className="bg-success-light rounded-cell p-3 flex items-center gap-2">
  <span>💡</span>
  <span className="text-success text-sm font-medium">
    Only pay for results. Change or pause your budget anytime.
  </span>
</div>
```

### Currency

Default: SEK (kr) for Swedish users. Make currency configurable per-market via a context provider or env variable.

---

## 7. Campaign card specification

### Objective selector

Display 3–5 objectives as selectable cards in a 2×2 grid:

| Objective | Icon | Description | AI pre-selects when |
|-----------|------|-------------|-------------------|
| Awareness | Eye icon | Get your brand seen by more people | New brands, content sites |
| Website traffic | Link icon | Drive visitors to your website | Blog, service pages |
| Sales | Cart icon | Get purchases or sign-ups | E-commerce sites (default) |
| Lead generation | Clipboard icon | Collect contact information | B2B service sites |

### Card states

- **Default:** AI pre-selects most likely objective. Pre-selected card has `border-accent` + "AI recommended" pill above
- **Selected:** `border-accent border-[1.5px]`, checkmark circle (22px, `bg-accent`, white ✓) in top-right
- **Hover:** `translateY(-2px)` transition 150ms, border highlights

### Campaign name input

Below objective grid. Pre-filled with AI-generated name: "{Brand} {Season} Campaign {Year}"
- Input: `bg-surface rounded-cell text-[15px] font-semibold p-3`

### Platform multi-select (if not set in brand card)

Toggle chips: Meta / Google / LinkedIn
- Selected: `bg-accent-light text-accent border-accent-border`
- Unselected: `bg-surface text-text-secondary border-border-light`

---

## 8. Onboarding flow (6-step wizard)

### Step indicator

Horizontal stepper at top. Six numbered circles (32px) connected by lines (40px wide, 2px height):
- Completed: `bg-success text-white` + checkmark
- Current: `bg-text-primary text-white`
- Upcoming: `bg-surface text-text-hint`
- Labels: 11px below each circle

### Step breakdown with time targets

| Step | Card type | CTA label | Target time | Celebration |
|------|-----------|-----------|-------------|-------------|
| 1. URL input | Single input | "Analyze my brand →" | 10 sec | Progressive status messages |
| 2. Brand confirm | Brand card | "Confirm brand →" | 30–60 sec | Bento cells fade-in with stagger |
| 3. Campaign setup | Campaign card | "Continue to budget →" | 15 sec | — |
| 4. Budget | Budget card | "Continue to ad preview →" | 20 sec | — |
| 5. Ad preview | Ad preview card | "Continue with variant [A/B] →" | 30 sec | Cards slide in from bottom |
| 6. Review + publish | Summary card | "Launch campaign 🚀" | 15 sec | Confetti + success state |

**Total target: under 3 minutes**

### Step 1: URL input

```
- Single centered input + primary CTA button
- Placeholder: "e.g. canon.se"
- On submit: button → loading state (Spinner + "Analyzing")
- Progressive messages (700ms intervals, fade-in animation):
  1. "Scanning website..."
  2. "Finding logo..."
  3. "Detecting colors..."
  4. "Analyzing typography..."
  5. "Identifying audience..."
  6. "Building brand profile..."
```

### Step 6: Review and publish

```
Summary card with rows:
  Brand:     Canon — canon.se          [Edit]
  Objective: Sales                     [Edit]
  Platforms: Meta, Google              [Edit]
  Budget:    150 kr/day (4,500 kr/mo)  [Edit]
  Creative:  Variant A — Score 84/100  [Edit]

Budget confirmation banner (amber, mandatory):
  "You'll spend up to 150 kr/day (max 4,500 kr/month).
   You can pause or change your budget at any time."

Primary CTA: Magic UI PulsatingButton — "Launch campaign 🚀"

On publish:
  → Magic UI Confetti animation (3 seconds)
  → Transition to success state with stats grid
  → Sonner toast: "Campaign is live!"
```

### Navigation rules

- Primary CTA: step-specific label (never generic "Next")
- Back button: always in header (except step 1)
- Completed steps in stepper: clickable (jump back)
- Auto-save: every step transition persists state
- No steps are skippable (all required)

---

## 9. Interaction and animation patterns

### Card animations

| Animation | Properties | Duration / Easing |
|-----------|-----------|-------------------|
| Card entrance | `opacity: 0, y: 16` → `opacity: 1, y: 0` | 300ms, `ease: [0.4, 0, 0.2, 1]` |
| Card hover (selectable) | `translateY(-2px)` | 150ms |
| Card tap/click | `scale(0.98)` | 100ms |
| Bento cell stagger | Each cell delays 80ms | ~600ms total for 6 cells |
| Step transition | AnimatePresence: exit left, enter right | 250ms |
| Slider value change | Number Ticker on metrics | 200ms |
| Score badge entrance | `scale: 0` → `scale: 1` | 400ms, spring |

### Motion implementation

```jsx
// Step transitions
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
  >
    {renderStep()}
  </motion.div>
</AnimatePresence>

// Bento cell stagger
<motion.div
  variants={{ show: { transition: { staggerChildren: 0.08 } } }}
  initial="hidden"
  animate="show"
>
  {cells.map(cell => (
    <motion.div
      key={cell.id}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 },
      }}
    >
      {cell.content}
    </motion.div>
  ))}
</motion.div>

// Card hover
<motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
  <Card>...</Card>
</motion.div>
```

### Button states

| State | Style |
|-------|-------|
| Default (secondary) | `bg-card border-[1.5px] border-border text-text-primary` |
| Primary | `bg-text-primary text-white border-none` |
| Hover | Slight darken/lighten, 150ms transition |
| Active | `scale(0.98)`, 100ms |
| Disabled | `opacity-40 cursor-not-allowed` |
| Loading | Spinner icon + text, disabled |

---

## 10. Accessibility requirements

- All interactive elements: keyboard navigable (Tab, Enter, Escape, Arrow keys)
- Focus rings: `ring-3 ring-accent-light` on all focusable elements
- Color contrast: WCAG 2.1 AA (4.5:1 normal text, 3:1 large text)
- Icon-only buttons: must have `aria-label`
- Reduced motion: respect `prefers-reduced-motion`. Disable all animations, fall back to instant state changes
- Form validation: errors via `aria-describedby`
- Step indicator: `aria-current="step"` on active step
- Color swatches: `aria-label` with hex value
- Budget slider: keyboard operable (arrows fine, Page Up/Down coarse)

---

## 11. Implementation checklist

### Phase 1: Foundations (Week 1)
- [ ] Configure Tailwind theme with all tokens from Section 2
- [ ] Install shadcn/ui base components
- [ ] Install Magic UI (BentoGrid, Confetti, Number Ticker, Shimmer Button)
- [ ] Install Tremor for charts
- [ ] Install Motion (framer-motion)
- [ ] Create shared wrappers: CardShell, Pill, FieldLabel components
- [ ] Set up step indicator / stepper component

### Phase 2: Card components (Weeks 2–3)
- [ ] Brand Card with bento grid layout + inline editing
- [ ] Campaign Card with objective selector + platform chips
- [ ] Budget Card with preset tiers + slider + live metrics + mini chart
- [ ] Ad Preview Card with A/B comparison + creative scoring + diff panel
- [ ] Review/Summary Card with edit links + budget confirmation

### Phase 3: Flow integration (Week 4)
- [ ] Wire up 6-step wizard with stepper + navigation
- [ ] AnimatePresence transitions between steps
- [ ] Progressive loading animation (Step 1)
- [ ] Celebration moments (brand detected, ad generated, launched)
- [ ] Auto-save at each step transition
- [ ] Back navigation + step jumping

### Phase 4: Polish (Week 5)
- [ ] Accessibility audit (keyboard nav, screen reader, contrast)
- [ ] Responsive: cards stack vertically on mobile
- [ ] Error states: network failures, API timeouts, validation
- [ ] Empty states: when AI detection fails for a field
- [ ] Performance: lazy load charts, code-split celebrations

---

## 12. Reference links

### Component libraries
- shadcn/ui: https://ui.shadcn.com/docs/components
- Magic UI BentoGrid: https://magicui.design/docs/components/bento-grid
- Magic UI Confetti: https://magicui.design/docs/components/confetti
- Tremor: https://tremor.so
- Motion: https://motion.dev
- ReUI Stepper: https://reui.io/patterns/stepper

### Design inspiration
- Brandfetch (brand card reference): https://brandfetch.com
- AdCreative.ai creative scoring: https://adcreative.ai/creative-scoring
- Canva Brand Kit: https://canva.com/pro/brand-kit
- Behance bento brand grid: https://behance.net/gallery/175149419
- Dribbble brand-kit tag: https://dribbble.com/tags/brand-kit
- Mobbin card patterns: https://mobbin.com/glossary/card
- SaaSFrame: https://saasframe.io
- SaaSUI: https://saasui.design

### Figma community files
- 150+ Stepper/Wizard Components: https://figma.com/community/file/1344038523808556624
- Onboarding UI Kit: https://figma.com/community/file/953654976053215565
- Brand Design Kit v6: https://figma.com/community/file/898121305391200697
- Social Media Ad Previews: https://figma.com/community/file/1169299732893383417

### Research
- SaaS onboarding best practices: https://designrevision.com/blog/saas-onboarding-best-practices
- AI confidence visualization: https://aiuxdesign.guide/patterns/confidence-visualization
- Growth.Design case studies: https://growth.design/case-studies
- Baymard slider UX: https://baymard.com/blog/slider-interfaces
- UserOnboard success states: https://useronboard.com/onboarding-ux-patterns/success-states
