// ── Platform character limits & CTA validation ─────────────────
// Single source of truth for all ad-platform copy constraints.
// Imported by the copywriter agent (server-side) and by
// copy-preview-card (client-side) so limits are always in sync.

export const PLATFORM_LIMITS = {
  meta: { headline: 40, bodyCopy: 125, description: 30, cta: 20 },
  google: { headline: 30, description: 90, cta: 20 },
  linkedin: { headline: 150, bodyCopy: 70, cta: 20 },
} as const;

export type PlatformId = keyof typeof PLATFORM_LIMITS;

export type CopyFields = {
  headline?: string;
  bodyCopy?: string;
  description?: string;
  cta?: string;
};

export type ValidationResult = {
  valid: boolean;
  violations: string[];
};

/**
 * Validate copy text lengths against the canonical platform limits.
 * Returns a list of human-readable violation strings (empty = valid).
 */
export function validateCopyLimits(
  platform: PlatformId,
  copy: CopyFields,
): ValidationResult {
  const limits = PLATFORM_LIMITS[platform];
  const violations: string[] = [];

  if (copy.headline && copy.headline.length > limits.headline) {
    violations.push(
      `Headline: ${copy.headline.length}/${limits.headline} chars`,
    );
  }

  if (
    copy.bodyCopy &&
    "bodyCopy" in limits &&
    copy.bodyCopy.length > (limits as { bodyCopy: number }).bodyCopy
  ) {
    violations.push(
      `Body: ${copy.bodyCopy.length}/${(limits as { bodyCopy: number }).bodyCopy} chars`,
    );
  }

  if (
    copy.description &&
    "description" in limits &&
    copy.description.length > limits.description
  ) {
    violations.push(
      `Description: ${copy.description.length}/${limits.description} chars`,
    );
  }

  if (copy.cta && copy.cta.length > limits.cta) {
    violations.push(`CTA: ${copy.cta.length}/${limits.cta} chars`);
  }

  return { valid: violations.length === 0, violations };
}

// ── Meta CTA button values (API enum values) ───────────────────
// These are the only CTA values Meta Ads Manager accepts.
// The copywriter must return one of these (or a display-friendly version).

export const META_CTAS = [
  "LEARN_MORE",
  "SHOP_NOW",
  "SIGN_UP",
  "SUBSCRIBE",
  "CONTACT_US",
  "GET_OFFER",
  "GET_QUOTE",
  "APPLY_NOW",
  "BOOK_NOW",
  "DOWNLOAD",
  "GET_DIRECTIONS",
  "ORDER_NOW",
  "CALL_NOW",
  "SEND_MESSAGE",
  "WATCH_MORE",
  "SEE_MENU",
  "LISTEN_NOW",
] as const;

export type MetaCta = (typeof META_CTAS)[number];

/** Display-friendly label for each Meta CTA enum value */
export const META_CTA_LABELS: Record<MetaCta, string> = {
  LEARN_MORE: "Lär dig mer",
  SHOP_NOW: "Handla nu",
  SIGN_UP: "Registrera dig",
  SUBSCRIBE: "Prenumerera",
  CONTACT_US: "Kontakta oss",
  GET_OFFER: "Hämta erbjudande",
  GET_QUOTE: "Begär offert",
  APPLY_NOW: "Ansök nu",
  BOOK_NOW: "Boka nu",
  DOWNLOAD: "Ladda ner",
  GET_DIRECTIONS: "Hitta hit",
  ORDER_NOW: "Beställ nu",
  CALL_NOW: "Ring nu",
  SEND_MESSAGE: "Skicka meddelande",
  WATCH_MORE: "Se mer",
  SEE_MENU: "Se meny",
  LISTEN_NOW: "Lyssna nu",
};

// ── Goal-to-CTA mapping (Swedish goal labels) ──────────────────
// Maps the Swedish campaign-goal strings used in the chat flow
// to the most relevant Meta CTA enum values.

export const GOAL_TO_CTAS: Record<string, MetaCta[]> = {
  "Fler kunder": ["CONTACT_US", "GET_QUOTE", "LEARN_MORE", "BOOK_NOW"],
  "Hitta personal": ["APPLY_NOW", "LEARN_MORE", "SIGN_UP"],
  "Lansera nytt": ["SHOP_NOW", "LEARN_MORE", "GET_OFFER"],
  "Synas mer": ["LEARN_MORE", "WATCH_MORE", "SUBSCRIBE"],
};

/**
 * Check whether a CTA string is a valid Meta CTA enum value.
 * Comparison is case-insensitive and normalises spaces/hyphens to underscores.
 */
export function isValidMetaCta(cta: string): boolean {
  const normalised = cta.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return (META_CTAS as readonly string[]).includes(normalised);
}

/**
 * Try to map a free-text CTA to the closest valid Meta CTA enum.
 * Returns the enum string if a match is found, otherwise undefined.
 */
export function normaliseMetaCta(cta: string): MetaCta | undefined {
  const normalised = cta.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if ((META_CTAS as readonly string[]).includes(normalised)) {
    return normalised as MetaCta;
  }

  // Try matching against display labels (Swedish)
  const lower = cta.trim().toLowerCase();
  for (const [key, label] of Object.entries(META_CTA_LABELS)) {
    if (label.toLowerCase() === lower) {
      return key as MetaCta;
    }
  }

  return undefined;
}

/**
 * Given a campaign goal (Swedish), return the recommended CTAs for Meta.
 * Falls back to a sensible default set if the goal is not recognised.
 */
export function getRecommendedCtas(goal: string): MetaCta[] {
  return GOAL_TO_CTAS[goal] ?? ["LEARN_MORE", "CONTACT_US", "SHOP_NOW"];
}
