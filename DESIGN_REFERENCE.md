# DESIGN_REFERENCE.md — Doost AI Wizard (v2)

> Single source of truth for all visual decisions.
> Claude Code: read this BEFORE writing any UI code. No deviations.

---

## Design philosophy

Design a modern, high-quality UI tailored for a **Scandinavian tech aesthetic**. Clean, minimal, elegant — strong attention to spacing, typography, and subtle details. Every element serves a clear purpose.

Incorporate a subtle **"AI presence"** through soft gradients, intelligent micro-interactions, fluid transitions, and slightly futuristic but restrained cues. The AI feeling is implicit — never overwhelming.

Prioritize **usability, clarity, and intuitive navigation**. The experience should feel calm, confident, and premium. Nordic design principles combined with a forward-looking, AI-driven touch.

### Core principles

1. **Calm confidence.** Concierge service, not a form. Quiet competence.
2. **One focus per screen.** One action. One CTA. Split if it tries to do two things.
3. **Purposeful restraint.** Every element earns its place. Whitespace is a design tool.
4. **Implicit intelligence.** AI is felt, not announced. Progressive revelation, animated numbers, breathing glow — not sparkle emojis.
5. **Nordic warmth.** Minimal ≠ cold. Rounded corners, warm zinc tones, friendly Swedish copy.

---

## Critical layout rule

```css
/* THE MOST IMPORTANT RULE: everything fits in viewport. No scrolling. */
.wizard-container {
  height: 100dvh;              /* Dynamic viewport — handles mobile address bar */
  display: flex;
  flex-direction: column;
  overflow: hidden;            /* NEVER scroll */
}

.wizard-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.wizard-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
}

.wizard-footer {
  height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-top: 1px solid var(--color-border-subtle);
}

.slide-content {
  max-width: 640px;
  width: 100%;
  max-height: calc(100dvh - 152px); /* header 56 + footer 72 + padding 24 */
}
```

**Minimum supported viewport: 640px height.**
Available content area: 640 - 56 - 72 - 48 = **464px**.
If content doesn't fit → the DESIGN is wrong, not the viewport. Simplify or split into more slides.

---

## AI presence — visual language

Apply consistently but sparingly. Overuse kills the effect.

### Ambient glow

```css
.wizard-bg {
  background:
    radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.04) 0%, transparent 70%),
    var(--color-bg-base);
}
```

If you can see it clearly, it's too strong. Subconscious only.

### Breathing pulse

```css
@keyframes ai-breathe {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.1); }
  50% { box-shadow: 0 0 35px rgba(99, 102, 241, 0.2); }
}
```

Apply to ONE element per screen only: primary CTA or progress bar leading edge. Never multiple.

### Progressive revelation

AI-generated content streams in with staggered delays:
- Brand card sections: top-to-bottom, 150ms stagger
- Ad cards: appear one by one, 200ms stagger
- Projection numbers: count from 0 to value, 600ms ease-out
- Description text: typewriter effect, 30ms/character (first load only)

### Fluid transitions

ALL state changes use spring physics. Never linear.

```ts
// Correct
transition: { type: 'spring', damping: 25, stiffness: 200 }
// Wrong
transition: { duration: 0.3, ease: 'linear' }
```

### Gradient border (ai-border)

Used on brand card and URL input only.

```css
.ai-border {
  position: relative;
  border: 1px solid transparent;
}
.ai-border::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.03) 50%, rgba(99, 102, 241, 0.1) 100%);
  z-index: -1;
  opacity: 0.5;
  transition: opacity 300ms ease;
  pointer-events: none;
}
.ai-border:hover::after { opacity: 1; }
```

Note: Uses `::after` (not `::before`) to avoid z-index stacking issues.

### Grain texture

```css
.wizard-grain::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 40;  /* Below modals (50) and tooltips (60) */
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

z-index: 40 (below modals at 50, tooltips at 60, overlays at 45).

### What AI presence is NOT

❌ Sparkle emojis, "AI" badges, neon gradients, robot icons, typing dots ("..."), particle effects, 3D, sound effects, animations >3s (except breathing).

---

## Color system

```css
:root {
  /* Primary */
  --color-primary: #6366F1;
  --color-primary-hover: #4F46E5;
  --color-primary-light: #A5B4FC;
  --color-primary-subtle: #EEF2FF;
  --color-primary-glow: rgba(99, 102, 241, 0.15);

  /* Surfaces (dark mode) */
  --color-bg-base: #09090B;
  --color-bg-elevated: #18181B;
  --color-bg-raised: #27272A;
  --color-bg-input: #1C1C21;
  --color-bg-hover: #2D2D33;

  /* Borders */
  --color-border-default: #27272A;
  --color-border-subtle: #1E1E23;
  --color-border-focus: #6366F1;

  /* Text */
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1AA;
  --color-text-muted: #71717A;
  --color-text-inverse: #09090B;

  /* Semantic */
  --color-success: #22C55E;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-warning: #F59E0B;
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  --color-error: #EF4444;
  --color-error-bg: rgba(239, 68, 68, 0.1);

  /* Platform brands */
  --color-meta: #1877F2;
  --color-google: #4285F4;
  --color-linkedin: #0A66C2;
  --color-tiktok: #000000;
  --color-snapchat: #FFFC00;
}
```

Rules: NEVER introduce new colors. User brand colors in ad previews only — never in wizard UI. Focus rings: `--color-border-focus` with 3px ring.

---

## Typography

```css
:root {
  --font-display: 'Satoshi', system-ui, sans-serif;
  --font-body: 'Satoshi', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Load from Fontshare: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`

| Token | Size | Weight | Line height | Letter spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `text-hero` | 40px | 900 | 1.1 | -0.03em | Slide 1 headline |
| `text-h1` | 28px | 700 | 1.2 | -0.02em | Slide titles |
| `text-h2` | 22px | 700 | 1.3 | -0.01em | Section headings |
| `text-h3` | 18px | 600 | 1.4 | -0.01em | Card titles |
| `text-body` | 16px | 400 | 1.6 | 0 | Body text |
| `text-body-sm` | 14px | 400 | 1.5 | 0 | Labels, secondary |
| `text-caption` | 12px | 500 | 1.4 | 0.02em | Captions, hints |
| `text-overline` | 11px | 700 | 1.2 | 0.08em | Badges (uppercase) |

Swedish text runs ~15% longer than English — account in layout.

---

## Spacing

8px base. Only multiples of 4px.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Icon-to-text |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Grid/flex gap |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Between sections |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Between cards |
| `space-10` | 40px | Section breaks |
| `space-12` | 48px | Content top padding |

---

## Border radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px | Buttons, badges, tags |
| `radius-md` | 10px | Inputs, small cards |
| `radius-lg` | 14px | Main cards |
| `radius-xl` | 20px | Brand card |
| `radius-full` | 9999px | Avatars, pills, progress bar |

---

## Shadows

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 16px 50px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 40px var(--color-primary-glow);
  --shadow-glow-sm: 0 0 20px var(--color-primary-glow);
}
```

---

## Z-index scale

| Layer | z-index | Use |
|-------|---------|-----|
| Base | 0 | Normal content |
| Elevated | 10 | Cards, sticky elements |
| Grain texture | 40 | Noise overlay |
| Overlay | 45 | Edit overlay, panels |
| Modal | 50 | Auth modal, confirms |
| Tooltip | 60 | Hover tooltips |
| Toast | 70 | Notifications |

---

## Framer Motion presets

```ts
export const transitions = {
  spring: { type: 'spring', damping: 25, stiffness: 200 },
  snappy: { type: 'spring', damping: 30, stiffness: 400 },
  gentle: { type: 'spring', damping: 20, stiffness: 120 },
  step: { type: 'spring', damping: 28, stiffness: 250 },
  stagger: { staggerChildren: 0.08, delayChildren: 0.1 },
  staggerSlow: { staggerChildren: 0.15, delayChildren: 0.2 },
} as const;

export const slideVariants = {
  enter: (dir: 1 | -1) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: 1 | -1) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.98 }),
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
```

### Animation rules
- `AnimatePresence mode="wait"` for slide transitions.
- Exit: 200ms. Enter: 400ms.
- Stagger: 80ms between items.
- Max 3 animated properties simultaneously.
- Loading shimmer: CSS-only (no Framer Motion).
- NEVER use `duration` with spring (they're physics-based).
- `prefers-reduced-motion`: replace springs with simple opacity fades.

---

## Component specifications

### Progress bar (header)

```
[Doost logo]           ████████░░░░░░░░  Steg 3 av 8   ✓ Sparat
```

```css
.progress-bar {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg-raised);
  overflow: hidden;
  flex: 1;
  max-width: 200px;
}
.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1);
  /* ai-breathe glow on leading edge via box-shadow */
}
```

- Hover → tooltip with slide names (see tooltip component below).
- "✓ Sparat" text: `text-caption`, `--color-success`, appears 2s after save, fades out.

### Footer / Bottom nav

```css
.wizard-footer {
  height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-back {
  /* Ghost button: transparent bg, --color-text-secondary, hover: --color-text-primary */
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-default);
}
.footer-cta {
  /* Primary CTA: see CTA button spec below */
  /* ai-breathe animation */
  min-width: 160px;
}
```

### CTA button (primary)

```css
.cta-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  padding: 12px 28px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-glow-sm);
  transition: background 150ms, box-shadow 150ms, transform 150ms;
  animation: ai-breathe 3s ease-in-out infinite;
}
.cta-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
  animation: none;
}
.cta-primary:active { transform: translateY(0); }
.cta-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  animation: none;
}
```

### URL input (Slide 1 — larger variant)

```css
.url-input {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 18px;           /* Larger than standard */
  font-weight: 500;
  padding: 14px 20px;        /* Taller: ~48px total height */
  width: 100%;
  max-width: 440px;
  transition: border-color 200ms, box-shadow 200ms;
}
.url-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
  outline: none;
}
/* Apply .ai-border class for gradient border effect */
```

### Standard input

```css
.input {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 16px;
  padding: 12px 16px;         /* ~44px height */
  transition: border-color 150ms, box-shadow 150ms;
}
.input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
  outline: none;
}
.input::placeholder { color: var(--color-text-muted); }
.input:disabled { opacity: 0.5; cursor: not-allowed; }
```

### Card

```css
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}
.brand-card {
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(99, 102, 241, 0.03) 100%);
  box-shadow: var(--shadow-lg), var(--shadow-glow-sm);
  /* Apply .ai-border for gradient border */
}
```

### Tag

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-raised);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: default;
  transition: background 150ms, border-color 150ms;
}
.tag:hover { background: var(--color-bg-hover); }
.tag-close {
  width: 14px; height: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
}
.tag-close:hover { color: var(--color-text-primary); }
.tag-add {
  border-style: dashed;
  color: var(--color-text-muted);
  cursor: pointer;
}
.tag-add:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
```

### Platform card (Slide 4)

```css
.platform-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  cursor: pointer;
  transition: border-color 200ms, transform 200ms, box-shadow 200ms;
}
.platform-card:hover {
  border-color: var(--color-border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.platform-card[data-selected="true"] {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow-sm);
}
.platform-card-coming-soon {
  opacity: 0.4;
  pointer-events: none;
  position: relative;
}
.platform-card-coming-soon::after {
  content: 'KOMMER SNART';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  background: rgba(9, 9, 11, 0.4);
  border-radius: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge-primary {
  background: var(--color-primary-glow);
  color: var(--color-primary-light);
}
.badge-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.badge-muted {
  background: var(--color-bg-raised);
  color: var(--color-text-muted);
}
```

### Slider / Range input

```css
.range-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg-raised);
  outline: none;
}
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: var(--shadow-glow-sm);
  cursor: grab;
  transition: transform 150ms, box-shadow 150ms;
}
.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: var(--shadow-glow);
}
.range-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}
/* Track fill: use a gradient or JS to color the filled portion with --color-primary */
```

Minimum touch target: 44×44px (thumb has 20px visible + invisible padding around).

### Checkbox / Selection

```css
.checkbox {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border-default);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 200ms, background 200ms;
}
.checkbox[data-checked="true"] {
  border-color: var(--color-primary);
  background: var(--color-primary);
}
/* Checkmark inside: animated SVG path with pathLength 0→1, 300ms */
```

### Tooltip

```css
.tooltip {
  position: absolute;
  z-index: 60;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-lg);
  font-size: 13px;
  color: var(--color-text-secondary);
  pointer-events: none;
  /* Enter: opacity 0→1, y 4→0, spring snappy */
  /* Exit: opacity 1→0, 100ms */
}
```

### Edit overlay (Slide 5)

```css
.edit-overlay {
  position: absolute;
  z-index: 45;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80%;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-default);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 24px;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
  /* Enter: slide up from bottom (y: 100% → 0, spring gentle) */
  /* Exit: slide down (y: 0 → 100%, 200ms) */
}
.edit-overlay-backdrop {
  position: absolute;
  inset: 0;
  z-index: 44;
  background: rgba(0, 0, 0, 0.4);
  /* Enter: opacity 0→1, 200ms */
}
```

### Platform mockup frame

```css
.platform-mockup {
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  overflow: hidden;
}
.platform-mockup-header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border-subtle);
}
.platform-mockup-image {
  width: 100%;
  aspect-ratio: 1 / 1;  /* or 1.91 / 1 for landscape */
  object-fit: cover;
}
.platform-mockup-footer {
  padding: 10px 14px;
  font-size: 12px;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border-subtle);
}
```

### Color swatch (brand card)

```css
.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border-default);
  cursor: pointer;
  transition: transform 150ms, box-shadow 150ms;
  /* background-color set dynamically via style attr */
}
.color-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 0 12px currentColor;  /* Glow matching swatch color */
}
```

### Number ticker (projections)

```css
.number-ticker {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  /* Animate via Framer Motion: count from previous value to new, 600ms ease-out */
  /* Or use Magic UI NumberTicker component */
}
.number-ticker-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

### Inline edit mode

```css
/* Display mode → Edit mode transition */
.editable-field[data-editing="false"] {
  cursor: pointer;
  border: 1px solid transparent;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 150ms;
}
.editable-field[data-editing="false"]:hover {
  background: var(--color-bg-hover);
}
.editable-field[data-editing="true"] {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-focus);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 3px var(--color-primary-glow);
  /* Enter transition: spring snappy */
}
```

---

## Error states

```css
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-error-bg);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-error);
  font-size: 14px;
  /* Enter: slide down + fade in, spring snappy */
}
.error-message-icon { flex-shrink: 0; width: 16px; height: 16px; }

/* Input validation error */
.input-error {
  border-color: var(--color-error);
}
.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}
.input-error-text {
  color: var(--color-error);
  font-size: 13px;
  margin-top: 6px;
  /* Enter: opacity + y slide, 150ms */
}
```

---

## Empty states

When brand card sections have no data:

```css
.empty-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 150ms, color 150ms;
}
.empty-prompt:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
/* Text: "Lägg till dina produkter →" / "Lägg till erbjudanden →" */
```

Rule: NEVER show empty labeled sections. If no data → hide section entirely, or show empty-prompt.

---

## Loading states

### Skeleton shimmer (CSS-only)

```css
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-raised) 25%, var(--color-bg-hover) 50%, var(--color-bg-raised) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Brand extraction loading (Slide 1→2)

4-phase choreography, each blending into the next:

1. **(0-3s)** URL input fades up. Pulsing glow center. "Hämtar din webbplats..."
2. **(3-6s)** Glow → company logo (crossfade, scale 0.8→1.0). Color dots emerge, 100ms stagger. "Analyserar varumärke..."
3. **(6-10s)** Logo + colors slide to card positions. Name (fade+slide), description (typewriter 30ms/char), tags. "Identifierar målgrupp..."
4. **(10s+)** Remaining sections stagger in. Card border transitions to ai-border gradient. Gleam sweep (left→right, 600ms). "Klart!" + green checkmark (pathLength).

### Ad generation loading (Slide 4→5)

2 skeleton cards with shimmer. As each ad renders server-side:
1. Shimmer stops
2. Content fades in (300ms)
3. Subtle scale bounce (1.0→1.02→1.0, spring snappy)

Progress: "Genererar annonser..." with count.

---

## Responsive

| Breakpoint | Width | Key changes |
|-----------|-------|-------------|
| Mobile | <640px | Single column, Embla carousel for ads, progress bar text only ("3/8") |
| Tablet | 640-1024px | 2-column where applicable |
| Desktop | >1024px | Full layout, 2 ads side by side |

### Mobile rules
- Minimum touch target: 44×44px
- Bottom footer: full-width CTA
- Slide 5 ads: stack vertically, Embla swipe between Hero and Brand
- Platform grid (Slide 4): 2 columns (3rd row wraps)
- Tags: horizontal scroll if many
- Progress bar: "3/8" instead of full text

---

## Micro-interactions

### Responsive (user-triggered)

| Element | Interaction | Animation |
|---------|------------|-----------|
| URL submit | Press | Scale 0.97→1.0 (snappy). Breathing stops. Spinner replaces text. |
| Brand card | Load | Progressive revelation (see loading states) |
| Color swatch | Hover | Scale 1.15, glow matching swatch color |
| Ad select | Toggle on | Checkmark pathLength 0→1 (300ms). Card pulse scale 1→1.02→1. Counter "+1". |
| Ad select | Toggle off | Checkmark pathLength 1→0. Card settles. Counter "-1". |
| Ad card | Hover | translateY(-3px), shadow deepens (spring) |
| Platform select | Toggle | Card lifts (translateY -2px). Border morphs to primary. Checkmark appears. |
| Budget slider | Drag | Projection number tickers animate to new value (600ms). |
| Platform connect | Success | Text→spinner→green checkmark→"Ansluten" (morphing sequence). |
| Platform connect | Failure | Shake 3×, 4px amplitude, 300ms. Error border flash. |
| Publish | Press | Ripple→spinner→confetti burst→success. |
| Edit toggle | Press | Field bg transitions to --color-bg-input. Border appears with ring. |

### Ambient (system-initiated)

| Element | Animation |
|---------|-----------|
| Primary CTA | ai-breathe 3s cycle. Stops on hover. |
| Progress bar edge | ai-breathe glow on leading edge. |
| Wizard background | Radial gradient glow, static. |
| Grain | Static noise at 2.5% opacity. |
| Brand card border | ai-border gradient, shifts on hover. |

---

## Accessibility

- Focus rings: `--color-border-focus` + 3px glow on all interactive elements
- Contrast: 4.5:1 body text, 3:1 large text (WCAG AA)
- Images: meaningful `alt` (ad previews describe content)
- Inputs: associated `<label>` elements
- Progress: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Loading: `aria-live="polite"` region with status text
- Keyboard: Tab/Shift+Tab navigates, Enter/Space activates
- `prefers-reduced-motion`: disable springs → simple opacity fades. Disable breathing pulse. Disable grain.

---

## Hard constraints

### Visual (never break)
1. No new colors outside palette.
2. No new border-radius outside tokens.
3. No new font sizes outside scale.
4. No inline styles — Tailwind utilities or CSS custom properties only.
5. Dark mode only for wizard.
6. Swedish copy only at launch (all strings via i18n).

### Quality (never skip)
7. Every async operation: loading state + error state.
8. Every input: inline validation feedback.
9. Mobile-first. Design 375px first, enhance up.
10. No generic shadcn defaults. Customize every component.

### Viewport (never break)
11. **100dvh. overflow: hidden. No scrolling. Ever.**
12. Max content height: 464px (minimum 640px viewport - 176px chrome).
13. If content doesn't fit → redesign, don't scroll.

### Scandinavian (always follow)
14. No clutter. Remove anything without clear purpose.
15. Generous whitespace. More space, not less.
16. One primary color focal point per screen (the CTA).
17. Subdued secondary elements. Muted borders, muted text.

### AI presence (always follow)
18. Implicit, never explicit. No "AI" labels, badges, emojis.
19. One breathing element per screen max.
20. Progressive revelation for ALL AI-generated content.
21. Spring physics everywhere. Never linear.
22. Restraint over spectacle. If AI presence is consciously noticed, it's too strong.
