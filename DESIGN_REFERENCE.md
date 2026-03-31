# DESIGN_REFERENCE.md — Doost AI

Extracted design tokens and component patterns. **Copy these exactly** when building new components.

## CSS Variables (globals.css :root)

```
--background: 0 0% 100%
--foreground: 221 54% 13%
--primary: 239 84% 67%          (indigo — #6366f1)
--primary-foreground: 0 0% 100%
--secondary: 210 40% 96.1%
--muted: 210 40% 96.1%
--muted-foreground: 221 20% 46%
--border: 214.3 31.8% 91.4%
--ring: 239 84% 67%
--radius: 0.5rem
--brand-blue: 216 70% 55%
--brand-teal: 170 100% 39%
```

## Fonts

- **Sans (body)**: `font-sans` → `var(--font-instrument-sans)` (Instrument Sans)
- **Sketch (headings)**: `font-sketch` → `var(--font-marker)` (Permanent Marker)

## Input Box (chat-input.tsx)

The URL input in the onboarding MUST use this exact pattern:

```
Container:  rainbow-glow mx-auto max-w-2xl
Box:        rounded-2xl border bg-white/60 p-2 shadow-sm backdrop-blur-xl border-border/40
Focus:      focus-within:border-indigo-300/60 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
Loading:    border-indigo-400/50 shadow-[0_0_0_4px_rgba(99,102,241,0.12)] animate-pulse
Textarea:   w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60
Submit btn: h-9 w-9 rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 disabled:opacity-30
```

## Cards

```
Standard:   rounded-2xl border border-border/30 bg-white/80 shadow-sm backdrop-blur-xl
Brand glow: .brand-card-glow (CSS class — adds inset gradient glow)
```

## CTA Buttons

```
Primary:    rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm
            hover:from-indigo-600 hover:to-indigo-700
Secondary:  rounded-xl border border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground
            hover:bg-muted/40
```

## Hero Typography (empty state)

```
Heading:    font-sketch text-[48px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]
Subtitle:   mt-4 max-w-xs text-center text-base text-muted-foreground
```

## Animations (existing CSS classes)

- `animate-message-in` — opacity 0→1, translateY 8→0, 0.3s ease-out
- `animate-card-in` — opacity 0→1, translateY 16→0, scale 0.98→1, 0.38s cubic-bezier
- `animate-shimmer` — background-position sweep, 1.5s infinite
- `animate-skeleton-reveal` — opacity 0→1, scale 0.97→1, 0.5s cubic-bezier
- `.rainbow-glow::after` — gradient blur under input box

## Reduced Motion

All custom animations are disabled via `@media (prefers-reduced-motion: reduce)`.
Framer Motion components should use `useReducedMotion()` hook.
