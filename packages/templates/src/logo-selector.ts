/**
 * Logo Placement Intelligence — pick the best logo variant for a given
 * background color based on luminance contrast.
 *
 * Used by the ad template renderer to auto-select the right logo variant
 * (light vs dark theme) so the logo is readable on any background.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogoVariant = {
  dataUrl: string;
  theme: string;   // "light" | "dark"
  source: string;   // "logo.dev" | "brandfetch" | "duckduckgo" | "clearbit" | "google"
};

// ---------------------------------------------------------------------------
// Luminance calculation (WCAG relative luminance)
// ---------------------------------------------------------------------------

/**
 * Calculate the relative luminance of a hex color (WCAG 2.0 formula).
 * Returns a value in [0, 1] where 0 = black, 1 = white.
 *
 * Uses the sRGB linearization step for correct perceptual weighting.
 */
function getLuminance(hex: string): number {
  // Strip # prefix, handle shorthand (#abc -> #aabbcc)
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  // sRGB linearization
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate WCAG contrast ratio between two luminances.
 * Returns a value >= 1.0 (1:1 = no contrast, 21:1 = max contrast).
 */
function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pick the best logo variant for a given background color.
 *
 * Strategy:
 * 1. If only one variant exists, return it (no choice to make).
 * 2. Determine if the background is dark or light.
 * 3. Prefer light-themed logos on dark backgrounds and dark/default-themed
 *    logos on light backgrounds — this maximizes contrast.
 * 4. If multiple variants share the preferred theme, pick the one from
 *    the highest quality source.
 *
 * @param variants - Array of logo variants (from LogoLibrary.variants)
 * @param bgColor  - Background color as hex string (e.g. "#1a1a2e", "#ffffff")
 * @returns The best variant, or null if the array is empty
 */
export function selectLogoForBackground(
  variants: LogoVariant[],
  bgColor: string,
): LogoVariant | null {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0]!;

  const bgLum = getLuminance(bgColor);
  const isDarkBg = bgLum < 0.5;

  // Source quality ranking (higher = better)
  const sourceRank: Record<string, number> = {
    "logo.dev": 5,
    "brandfetch": 4,
    "clearbit": 3,
    "duckduckgo": 2,
    "google": 1,
  };

  // Score each variant: theme match is primary, source quality is tiebreaker
  const scored = variants.map((v) => {
    let themeScore = 0;

    if (isDarkBg) {
      // Dark background → prefer light-themed logos (white/light colors stand out)
      if (v.theme === "light") themeScore = 10;
      else if (v.theme === "dark") themeScore = 0;
      else themeScore = 5; // unknown theme — neutral
    } else {
      // Light background → prefer dark-themed logos (dark colors stand out)
      if (v.theme === "dark") themeScore = 10;
      else if (v.theme === "light") themeScore = 2; // light on light is worst, but still usable
      else themeScore = 5; // unknown theme — neutral
    }

    const qualityScore = sourceRank[v.source] ?? 0;

    return { variant: v, score: themeScore * 10 + qualityScore };
  });

  // Sort descending by score, pick best
  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.variant;
}

/**
 * Check if a logo variant has sufficient contrast against a background color.
 * Uses a simplified check: if the contrast ratio between the background
 * luminance and an estimated logo luminance (based on theme) meets the
 * minimum threshold, it passes.
 *
 * This is a heuristic — we don't analyze the actual logo pixels, just use
 * the theme label as a proxy for the logo's dominant brightness.
 *
 * @param theme   - Logo theme ("light" or "dark")
 * @param bgColor - Background hex color
 * @param minRatio - Minimum contrast ratio (default 2.0 — relaxed for logos)
 * @returns true if the estimated contrast is sufficient
 */
export function hasAdequateContrast(
  theme: string,
  bgColor: string,
  minRatio = 2.0,
): boolean {
  const bgLum = getLuminance(bgColor);

  // Estimate logo luminance from theme label
  // Light logos ≈ 0.85 luminance, dark logos ≈ 0.15 luminance
  const logoLum = theme === "dark" ? 0.15 : 0.85;

  return contrastRatio(bgLum, logoLum) >= minRatio;
}

// Re-export getLuminance for testing / advanced usage
export { getLuminance, contrastRatio };
