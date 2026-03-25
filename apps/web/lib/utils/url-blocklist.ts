const BLOCKED_DOMAINS = [
  "google.com", "youtube.com", "facebook.com", "instagram.com",
  "twitter.com", "x.com", "linkedin.com", "tiktok.com",
  "github.com", "stackoverflow.com", "wikipedia.org",
  "amazon.com", "apple.com", "microsoft.com",
];

const URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:com|se|io|ai|co|net|org|dev|app|tech|cloud|eu|no|fi|dk|de|uk|fr))/gi;

export function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  if (!match) return null;
  const raw = match[0];
  const domain = raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]!.toLowerCase();
  if (BLOCKED_DOMAINS.some((d) => domain.endsWith(d))) return null;
  // Always return with https://
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export function extractDomain(text: string): string | null {
  const url = extractUrl(text);
  if (!url) return null;
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]!.toLowerCase();
}

export function isBlockedDomain(domain: string): boolean {
  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").toLowerCase();
  return BLOCKED_DOMAINS.some((d) => clean.endsWith(d));
}
