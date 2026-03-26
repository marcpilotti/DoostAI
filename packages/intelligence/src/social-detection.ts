/**
 * L3: Detect social media profiles from website HTML.
 * Scans links, meta tags, and common URL patterns.
 */

export type SocialProfile = {
  platform: string;
  url: string;
  confidence: number;
};

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/gi,
  linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+/gi,
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9._-]+/gi,
  youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[a-zA-Z0-9._-]+/gi,
  tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/gi,
};

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
  for (const link of links) {
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
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
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
      if (!seen.has(url)) {
        seen.add(url);
        found.push({ platform, url, confidence: 70 });
      }
    }
  }

  // Method 3: Common URL patterns (guess)
  const domain = extractDomainFromHtml(html);
  if (domain && found.length === 0) {
    const name = domain.split(".")[0];
    if (name) {
      const guesses = [
        { platform: "facebook", url: `https://facebook.com/${name}`, confidence: 20 },
        { platform: "instagram", url: `https://instagram.com/${name}`, confidence: 20 },
        { platform: "linkedin", url: `https://linkedin.com/company/${name}`, confidence: 20 },
      ];
      found.push(...guesses);
    }
  }

  return found;
}

function extractDomainFromHtml(html: string): string | null {
  const match = html.match(/og:url['"]\s*content=['"](https?:\/\/[^'"]+)/i);
  if (match?.[1]) {
    try {
      return new URL(match[1]).hostname.replace(/^www\./, "");
    } catch {}
  }
  return null;
}
