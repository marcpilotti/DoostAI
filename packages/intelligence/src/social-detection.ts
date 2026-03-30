/**
 * L3: Detect social media profiles from website HTML.
 * Scans links, meta tags, and common URL patterns.
 */

export type SocialProfile = {
  platform: string;
  url: string;
  confidence: number;
  followers?: number;
  verified?: boolean;
};

const SOCIAL_PATTERN_SOURCES: Record<string, string> = {
  facebook: "(?:https?:\\/\\/)?(?:www\\.)?facebook\\.com\\/[a-zA-Z0-9._-]+",
  instagram: "(?:https?:\\/\\/)?(?:www\\.)?instagram\\.com\\/[a-zA-Z0-9._-]+",
  linkedin: "(?:https?:\\/\\/)?(?:www\\.)?linkedin\\.com\\/(?:company|in)\\/[a-zA-Z0-9._-]+",
  twitter: "(?:https?:\\/\\/)?(?:www\\.)?(?:twitter\\.com|x\\.com)\\/[a-zA-Z0-9._-]+",
  youtube: "(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/(?:@|channel\\/|c\\/)[a-zA-Z0-9._-]+",
  tiktok: "(?:https?:\\/\\/)?(?:www\\.)?tiktok\\.com\\/@[a-zA-Z0-9._-]+",
};

/** Create fresh RegExp instances to avoid shared lastIndex state. */
function createSocialPatterns(): Record<string, RegExp> {
  const patterns: Record<string, RegExp> = {};
  for (const [platform, source] of Object.entries(SOCIAL_PATTERN_SOURCES)) {
    patterns[platform] = new RegExp(source, "gi");
  }
  return patterns;
}

/**
 * Extract social media URLs from raw HTML content.
 */
export function detectSocialPresence(
  html: string,
  links: string[],
): SocialProfile[] {
  const found: SocialProfile[] = [];
  const seen = new Set<string>();

  // Method 1: Scan all links from the page
  // Fresh patterns per call — no shared lastIndex state
  const linkPatterns = createSocialPatterns();
  for (const link of links) {
    for (const [platform, pattern] of Object.entries(linkPatterns)) {
      pattern.lastIndex = 0;
      const match = pattern.exec(link);
      if (match) {
        const url = match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
        if (!seen.has(url)) {
          seen.add(url);
          found.push({ platform, url, confidence: 90 });
        }
      }
    }
  }

  // Method 2: Scan raw HTML for social links
  // Fresh patterns — Method 1 patterns may have advanced lastIndex
  const htmlPatterns = createSocialPatterns();
  for (const [platform, pattern] of Object.entries(htmlPatterns)) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
      if (!seen.has(url)) {
        seen.add(url);
        found.push({ platform, url, confidence: 70 });
      }
    }
  }

  return found;
}

/**
 * Enrich social profiles by validating that detected URLs are actually live.
 *
 * Uses HEAD requests with a 2-second timeout per URL. Profiles that respond
 * with HTTP 200 get `verified: true`; anything else (timeout, 404, redirect
 * loops, network errors) gets `verified: false`.
 *
 * This filters out dead or wrongly-detected social links without needing
 * any platform API keys or scraping. Follower counts require authenticated
 * API access on all major platforms, so we don't attempt that here.
 */
export async function enrichSocialProfiles(
  profiles: SocialProfile[],
): Promise<SocialProfile[]> {
  if (profiles.length === 0) return profiles;

  const results = await Promise.allSettled(
    profiles.map(async (profile) => {
      try {
        const res = await fetch(profile.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(2000),
          redirect: "follow",
        });
        return { ...profile, verified: res.ok };
      } catch {
        return { ...profile, verified: false };
      }
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ...profiles[i]!, verified: false }
  );
}

function extractDomainFromHtml(html: string): string | null {
  const match = html.match(/property=["']og:url["']\s+content=["'](https?:\/\/[^"']+)/i);
  if (match?.[1]) {
    try {
      return new URL(match[1]).hostname.replace(/^www\./, "");
    } catch {}
  }
  return null;
}
