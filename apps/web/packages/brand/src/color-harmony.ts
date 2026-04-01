/**
 * Color Harmony Intelligence — Brand Color Expansion (Phase 2, Feature #5)
 *
 * Generates complementary color palettes using color theory (HSL rotation).
 * Derives full UI palettes (text, background, shadow, CTA) from brand colors.
 *
 * Zero npm dependencies — pure math.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  shadow: string;
  ctaBackground: string;
  ctaText: string;
};

export type HarmonySet = {
  original: ColorPalette;
  complementary: ColorPalette;
  analogous: ColorPalette;
  triadic: ColorPalette;
};

// ---------------------------------------------------------------------------
// Hex <-> RGB <-> HSL conversions (no npm packages)
// ---------------------------------------------------------------------------

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

/** Normalize any valid CSS hex (#abc or #aabbcc) to a 6-digit lowercase form. */
function normalizeHex(hex: string): string {
  const h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (h.length === 6) {
    return `#${h}`;
  }
  // Fallback for invalid input
  return "#6366f1";
}

function hexToRgb(hex: string): Rgb {
  const h = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB (0-255 per channel) to HSL (h: 0-360, s: 0-100, l: 0-100).
 */
function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / delta + 2) * 60;
    } else {
      h = ((r - g) / delta + 4) * 60;
    }
  }

  return { h, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL (h: 0-360, s: 0-100, l: 0-100) to RGB (0-255 per channel).
 */
function hslToRgb(hsl: Hsl): Rgb {
  const h = hsl.h;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  return {
    r: Math.round(hueToRgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hNorm) * 255),
    b: Math.round(hueToRgb(p, q, hNorm - 1 / 3) * 255),
  };
}

function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

// ---------------------------------------------------------------------------
// Hue rotation helpers
// ---------------------------------------------------------------------------

/** Rotate hue by `degrees`, wrapping around 360. */
function rotateHue(hsl: Hsl, degrees: number): Hsl {
  return {
    h: ((hsl.h + degrees) % 360 + 360) % 360,
    s: hsl.s,
    l: hsl.l,
  };
}

// ---------------------------------------------------------------------------
// Luminance & contrast helpers
// ---------------------------------------------------------------------------

/**
 * Relative luminance (WCAG 2.1) from a hex color.
 * Returns 0 (black) to 1 (white).
 */
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const linearize = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

/** Returns true if the color is perceptually "light" (luminance > 0.5). */
function isLight(hex: string): boolean {
  return relativeLuminance(hex) > 0.5;
}

/**
 * WCAG 2.1 contrast ratio between two colors (1:1 to 21:1).
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pick the better contrast text color for a given background.
 * Returns "#1a1a1a" (dark) or "#ffffff" (white).
 */
function getContrastTextColor(bgHex: string): string {
  return isLight(bgHex) ? "#1a1a1a" : "#ffffff";
}

/**
 * Ensure the CTA text has at least WCAG AA contrast (4.5:1) against the CTA
 * background. If not, try adjusting lightness of the text.
 */
function ensureCtaContrast(ctaBg: string, preferredText: string): string {
  if (contrastRatio(ctaBg, preferredText) >= 4.5) {
    return preferredText;
  }
  // Fall back to guaranteed-contrast dark/light
  return getContrastTextColor(ctaBg);
}

// ---------------------------------------------------------------------------
// Palette derivation
// ---------------------------------------------------------------------------

/**
 * Derive a very light tint of a color (simulates 5% opacity on white).
 * This creates a soft branded background.
 */
function deriveLightTint(hex: string): string {
  const hsl = hexToHsl(hex);
  // Push lightness to 96-98% while keeping hue and reducing saturation
  return hslToHex({
    h: hsl.h,
    s: Math.min(hsl.s, 30),
    l: Math.max(96, Math.min(98, 100 - hsl.l * 0.04)),
  });
}

/**
 * Derive a shadow color: the primary color darkened significantly with opacity.
 * Returns a hex that represents ~30% opacity of a darkened primary.
 * We blend with white to simulate the opacity since hex doesn't support alpha.
 */
function deriveShadow(hex: string): string {
  const hsl = hexToHsl(hex);
  // Darken: reduce lightness to ~25%, keep hue, reduce saturation slightly
  const darkened: Hsl = {
    h: hsl.h,
    s: Math.max(hsl.s * 0.7, 10),
    l: Math.min(hsl.l * 0.4, 25),
  };
  const darkRgb = hslToRgb(darkened);

  // Simulate 30% opacity over white: result = color * 0.3 + white * 0.7
  const blended: Rgb = {
    r: Math.round(darkRgb.r * 0.3 + 255 * 0.7),
    g: Math.round(darkRgb.g * 0.3 + 255 * 0.7),
    b: Math.round(darkRgb.b * 0.3 + 255 * 0.7),
  };
  return rgbToHex(blended);
}

/**
 * Build a full ColorPalette from primary, secondary, and accent hex colors.
 */
function buildPalette(primary: string, secondary: string, accent: string): ColorPalette {
  const ctaBg = accent;
  const ctaText = ensureCtaContrast(ctaBg, getContrastTextColor(ctaBg));

  return {
    primary: normalizeHex(primary),
    secondary: normalizeHex(secondary),
    accent: normalizeHex(accent),
    text: getContrastTextColor(deriveLightTint(primary)),
    background: deriveLightTint(primary),
    shadow: deriveShadow(primary),
    ctaBackground: normalizeHex(ctaBg),
    ctaText,
  };
}

// ---------------------------------------------------------------------------
// Harmony generation
// ---------------------------------------------------------------------------

/**
 * Generate 4 harmonious palettes from brand colors.
 *
 * - **original**: The brand's actual colors with derived UI tokens.
 * - **complementary**: Hue rotated +180 degrees (opposite on the wheel).
 * - **analogous**: Hue rotated +30 / -30 degrees (neighbors on the wheel).
 * - **triadic**: Hue rotated +120 / -120 degrees (equilateral triangle).
 *
 * Each palette includes derived `text`, `background`, `shadow`,
 * `ctaBackground`, and `ctaText` colors suitable for ad previews.
 */
export function generateHarmonySet(
  primary: string,
  secondary?: string,
  accent?: string,
): HarmonySet {
  const pHsl = hexToHsl(primary);
  const sHsl = secondary ? hexToHsl(secondary) : rotateHue(pHsl, 15);
  const aHsl = accent ? hexToHsl(accent) : rotateHue(pHsl, -15);

  // Original: use the brand's actual colors
  const original = buildPalette(
    primary,
    secondary ?? hslToHex(sHsl),
    accent ?? hslToHex(aHsl),
  );

  // Complementary: rotate all three colors by +180 degrees
  const compPrimary = hslToHex(rotateHue(pHsl, 180));
  const compSecondary = hslToHex(rotateHue(sHsl, 180));
  const compAccent = hslToHex(rotateHue(aHsl, 180));
  const complementary = buildPalette(compPrimary, compSecondary, compAccent);

  // Analogous: primary stays, secondary shifts +30, accent shifts -30
  const analogPrimary = primary;
  const analogSecondary = hslToHex(rotateHue(pHsl, 30));
  const analogAccent = hslToHex(rotateHue(pHsl, -30));
  const analogous = buildPalette(analogPrimary, analogSecondary, analogAccent);

  // Triadic: primary stays, secondary shifts +120, accent shifts -120
  const triadPrimary = primary;
  const triadSecondary = hslToHex(rotateHue(pHsl, 120));
  const triadAccent = hslToHex(rotateHue(pHsl, -120));
  const triadic = buildPalette(triadPrimary, triadSecondary, triadAccent);

  return { original, complementary, analogous, triadic };
}

/**
 * Convenience: generate just the "original" palette expansion from brand colors.
 * Use this when you only need the derived UI tokens (shadow, CTA, background)
 * without the full harmony set.
 */
export function expandBrandPalette(
  primary: string,
  secondary?: string,
  accent?: string,
): ColorPalette {
  return buildPalette(
    primary,
    secondary ?? hslToHex(rotateHue(hexToHsl(primary), 15)),
    accent ?? hslToHex(rotateHue(hexToHsl(primary), -15)),
  );
}
