"use client";

import { useMemo } from "react";
import { PLATFORM_LIMITS } from "@doost/ai/platform-limits";
import type { PlatformId } from "@doost/ai/platform-limits";

type FieldStatus = "ok" | "warning" | "error";

type FieldValidation = {
  status: FieldStatus;
  current: number;
  limit: number;
  percentage: number;
  /** Swedish explanation of what happens when the limit is exceeded */
  message: string | null;
};

type AdValidation = {
  headline: FieldValidation;
  bodyCopy: FieldValidation;
  cta: FieldValidation;
  hasErrors: boolean;
  hasWarnings: boolean;
  /** Human-readable Swedish summary, e.g. "Alla falt OK" */
  summary: string;
};

/**
 * Platform-specific error messages in Swedish.
 * Explains *what happens* when a field exceeds the limit — not just that it does.
 */
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  meta: {
    headline:
      "Meta trunkerar rubriker längre än 40 tecken. Annonsen kan avvisas.",
    bodyCopy:
      "Meta trunkerar primärtext efter 125 tecken i flödet. De flesta ser inte resten.",
    cta: "CTA-text får vara max 20 tecken på Meta.",
  },
  google: {
    headline:
      "Google avvisar rubriker över 30 tecken. Annonsen publiceras inte.",
    bodyCopy: "Google avvisar beskrivningar över 90 tecken.",
    cta: "CTA-text får vara max 20 tecken.",
  },
  linkedin: {
    headline: "LinkedIn visar max 70 tecken i rubriken.",
    bodyCopy: "LinkedIn trunkerar text efter 150 tecken.",
    cta: "CTA-text får vara max 20 tecken.",
  },
};

/**
 * Resolve a free-text platform string to the canonical PlatformId.
 * Mirrors the logic already in copy-preview-card.tsx so the two stay in sync.
 */
function resolvePlatform(p: string): PlatformId {
  const lower = p.toLowerCase();
  if (lower === "meta" || lower === "facebook" || lower === "instagram")
    return "meta";
  if (lower === "google") return "google";
  if (lower === "linkedin") return "linkedin";
  return "meta";
}

/**
 * Validate a single copy field and return a 3-level status:
 *   ok      — under 80 % of limit
 *   warning — 80-99 % of limit
 *   error   — at or over limit
 */
function validateField(
  value: string,
  limit: number,
  fieldName: string,
  pid: PlatformId,
): FieldValidation {
  const current = value.length;
  const percentage = Math.round((current / limit) * 100);

  if (percentage >= 100) {
    return {
      status: "error",
      current,
      limit,
      percentage,
      message:
        ERROR_MESSAGES[pid]?.[fieldName] ??
        `Överskrider gränsen (${current}/${limit})`,
    };
  }

  if (percentage >= 80) {
    return { status: "warning", current, limit, percentage, message: null };
  }

  return { status: "ok", current, limit, percentage, message: null };
}

/**
 * Validates ad copy against platform-specific character limits.
 *
 * Returns per-field validation (ok / warning / error) plus an overall summary.
 * The hook is memoised — it only recalculates when the inputs change.
 *
 * @example
 * ```tsx
 * const v = useAdValidation("meta", { headline: "Boka nu", bodyCopy: "...", cta: "Läs mer" });
 * if (v.hasErrors) showBanner(v.summary);
 * ```
 */
export function useAdValidation(
  platform: string,
  copy: { headline: string; bodyCopy: string; cta: string },
): AdValidation {
  return useMemo(() => {
    const pid = resolvePlatform(platform);
    const limits = PLATFORM_LIMITS[pid];

    const headline = validateField(
      copy.headline,
      limits.headline,
      "headline",
      pid,
    );

    const bodyCopyLimit =
      "bodyCopy" in limits
        ? (limits as { bodyCopy: number }).bodyCopy
        : 9999;
    const bodyCopy = validateField(
      copy.bodyCopy,
      bodyCopyLimit,
      "bodyCopy",
      pid,
    );

    const cta = validateField(copy.cta, limits.cta, "cta", pid);

    const fields = [headline, bodyCopy, cta];
    const hasErrors = fields.some((f) => f.status === "error");
    const hasWarnings = fields.some((f) => f.status === "warning");
    const errorCount = fields.filter((f) => f.status === "error").length;
    const warningCount = fields.filter((f) => f.status === "warning").length;

    let summary = "Alla fält OK";
    if (hasErrors) {
      summary = `${errorCount} fält överskrider gränsen`;
    } else if (hasWarnings) {
      summary = `${warningCount} fält nära gränsen`;
    }

    return { headline, bodyCopy, cta, hasErrors, hasWarnings, summary };
  }, [platform, copy.headline, copy.bodyCopy, copy.cta]);
}
