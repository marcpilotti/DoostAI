import type { LayoutDefinition, LayoutFormat, Platform } from "./types";

// ---------------------------------------------------------------------------
// Layout catalogue — 14 data-driven layout definitions
//
// Each layout is a pure JSON config of composable blocks.  The
// `layout-renderer` maps these definitions to CSS-based preview JSX.
// Adding a new layout variation is as simple as adding another entry here —
// no new components required.
// ---------------------------------------------------------------------------

export const LAYOUTS: LayoutDefinition[] = [
  // ─── Meta Feed (1:1) ─────────────────────────────────────────────────────
  {
    id: "meta-hero-centered",
    name: "Hero Centrerad",
    platform: "meta",
    format: "feed",
    aspectRatio: "1:1",
    dimensions: { width: 1080, height: 1080 },
    blocks: [
      { type: "hero", props: { alignment: "center", textSize: "lg" } },
    ],
  },
  {
    id: "meta-split-left",
    name: "Delad Vänster",
    platform: "meta",
    format: "feed",
    aspectRatio: "1:1",
    dimensions: { width: 1080, height: 1080 },
    blocks: [
      { type: "split", props: { imagePosition: "right" } },
    ],
  },
  {
    id: "meta-split-right",
    name: "Delad Höger",
    platform: "meta",
    format: "feed",
    aspectRatio: "1:1",
    dimensions: { width: 1080, height: 1080 },
    blocks: [
      { type: "split", props: { imagePosition: "left" } },
    ],
  },
  {
    id: "meta-bold-cta",
    name: "Tydlig CTA",
    platform: "meta",
    format: "feed",
    aspectRatio: "1:1",
    dimensions: { width: 1080, height: 1080 },
    blocks: [
      { type: "bold", props: { ctaStyle: "full-width" } },
    ],
  },
  {
    id: "meta-minimal",
    name: "Minimal",
    platform: "meta",
    format: "feed",
    aspectRatio: "1:1",
    dimensions: { width: 1080, height: 1080 },
    blocks: [
      { type: "minimal", props: {} },
    ],
  },
  {
    id: "meta-logo-hero",
    name: "Logo + Hero",
    platform: "meta",
    format: "feed",
    aspectRatio: "1:1",
    dimensions: { width: 1080, height: 1080 },
    blocks: [
      { type: "logo-strip", props: { position: "top" } },
      { type: "hero", props: { alignment: "center", textSize: "md" } },
    ],
  },

  // ─── Meta Story (9:16) ────────────────────────────────────────────────────
  {
    id: "meta-story-hero",
    name: "Story Hero",
    platform: "meta",
    format: "story",
    aspectRatio: "9:16",
    dimensions: { width: 1080, height: 1920 },
    blocks: [
      { type: "hero", props: { alignment: "bottom", textSize: "xl" } },
    ],
  },
  {
    id: "meta-story-minimal",
    name: "Story Minimal",
    platform: "meta",
    format: "story",
    aspectRatio: "9:16",
    dimensions: { width: 1080, height: 1920 },
    blocks: [
      { type: "minimal", props: { logoPosition: "top" } },
    ],
  },

  // ─── Google Search ────────────────────────────────────────────────────────
  {
    id: "google-search",
    name: "Sökannons",
    platform: "google",
    format: "search",
    aspectRatio: "16:9",
    dimensions: { width: 600, height: 200 },
    blocks: [
      { type: "minimal", props: { style: "search-result" } },
    ],
  },

  // ─── Google Display ───────────────────────────────────────────────────────
  {
    id: "google-display-banner",
    name: "Display Banner",
    platform: "google",
    format: "display",
    aspectRatio: "16:9",
    dimensions: { width: 728, height: 90 },
    blocks: [
      { type: "hero", props: { alignment: "left" } },
    ],
  },
  {
    id: "google-display-rect",
    name: "Display Rektangel",
    platform: "google",
    format: "display",
    aspectRatio: "1:1",
    dimensions: { width: 300, height: 250 },
    blocks: [
      { type: "hero", props: { alignment: "center", textSize: "sm" } },
      { type: "cta-bar", props: { position: "bottom" } },
    ],
  },

  // ─── LinkedIn Sponsored ───────────────────────────────────────────────────
  {
    id: "linkedin-sponsored-hero",
    name: "Sponsrad Post",
    platform: "linkedin",
    format: "sponsored",
    aspectRatio: "1:1",
    dimensions: { width: 1200, height: 627 },
    blocks: [
      { type: "hero", props: { alignment: "center", style: "corporate" } },
    ],
  },
  {
    id: "linkedin-sidebar",
    name: "Sidopanel",
    platform: "linkedin",
    format: "sponsored",
    aspectRatio: "1:1",
    dimensions: { width: 1200, height: 627 },
    blocks: [
      { type: "sidebar", props: {} },
    ],
  },
  {
    id: "linkedin-bold-cta",
    name: "LinkedIn CTA",
    platform: "linkedin",
    format: "sponsored",
    aspectRatio: "1:1",
    dimensions: { width: 1200, height: 627 },
    blocks: [
      { type: "bold", props: { ctaStyle: "pill", style: "corporate" } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const _byId = new Map(LAYOUTS.map((l) => [l.id, l]));

/** Retrieve a single layout by its unique id. */
export function getLayout(id: string): LayoutDefinition | undefined {
  return _byId.get(id);
}

/** Filter layouts by platform and optional format. */
export function getLayoutsForPlatform(
  platform: Platform,
  format?: LayoutFormat,
): LayoutDefinition[] {
  return LAYOUTS.filter(
    (l) => l.platform === platform && (!format || l.format === format),
  );
}

/** Return all unique format values available for a given platform. */
export function getFormatsForPlatform(platform: Platform): LayoutFormat[] {
  const formats = new Set<LayoutFormat>();
  for (const l of LAYOUTS) {
    if (l.platform === platform) formats.add(l.format);
  }
  return [...formats];
}
