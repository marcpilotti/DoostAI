/**
 * L4: Logo extraction via Brandfetch, Logo.dev, and Google Favicons.
 *
 * KEY INSIGHT: Brandfetch CDN returns 403 for browser <img> tags (HEAD blocked,
 * GET works server-side only). Logo.dev returns 404 for many domains.
 * Google Favicons works universally but is lower quality.
 *
 * SOLUTION: Download the best logo server-side during the pipeline and embed
 * as a base64 data URL. This guarantees the logo renders in the browser.
 */

export type BrandfetchResult = {
  logos: { url: string; type: string; theme: string }[];
  colors: { hex: string; type: string }[];
  fonts: { name: string; weight: number; type: string }[];
  confidence: number;
};

export type DownloadedLogo = {
  dataUrl: string;   // data:image/png;base64,... — ready for <img src>
  source: string;    // "logo.dev" | "brandfetch" | "google"
  theme: string;     // "light" | "dark"
  width: number;
};

/**
 * Brandfetch API — returns logo URLs, colors, and fonts.
 */
async function fetchBrandfetch(domain: string): Promise<BrandfetchResult | null> {
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey || apiKey === "your_brandfetch_api_key") return null;

  try {
    const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json() as {
      logos?: Array<{ formats?: Array<{ src: string; format: string }>; type?: string; theme?: string }>;
      colors?: Array<{ hex: string; type?: string }>;
      fonts?: Array<{ name: string; weight?: number; type?: string }>;
    };

    // Pick best format per logo: PNG > JPEG > SVG
    const logos = (data.logos ?? []).map((logo) => {
      const formats = logo.formats ?? [];
      const png = formats.find((f) => f.format === "png");
      const jpeg = formats.find((f) => f.format === "jpeg");
      const svg = formats.find((f) => f.format === "svg");
      const best = png ?? jpeg ?? svg;
      return best ? { url: best.src, type: logo.type ?? "logo", theme: logo.theme ?? "light" } : null;
    }).filter((l): l is NonNullable<typeof l> => l !== null && !!l.url);

    const colors = (data.colors ?? []).map((c) => ({ hex: c.hex, type: c.type ?? "brand" }));
    const fonts = (data.fonts ?? []).map((f) => ({ name: f.name, weight: f.weight ?? 400, type: f.type ?? "body" }));

    console.log(`[L4 Brandfetch] ${domain} → ${logos.length} logos, ${colors.length} colors, ${fonts.length} fonts`);
    return { logos, colors, fonts, confidence: 95 };
  } catch (err) {
    console.warn("[L4 Brandfetch] Failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Download an image and convert to base64 data URL.
 * Returns null if the URL doesn't return a valid image.
 */
async function downloadAsDataUrl(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 500_000) return null; // skip empty or huge

    const base64 = Buffer.from(buf).toString("base64");
    return `data:${contentType.split(";")[0]};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Download the best available logo for a domain.
 * Tries sources in quality order, returns the first that works.
 * The result is a base64 data URL — no external URL issues in the browser.
 */
async function downloadBestLogo(
  domain: string,
  brandfetchLogos: { url: string; type: string; theme: string }[],
): Promise<DownloadedLogo | null> {
  // 1. Logo.dev — highest quality, designed for embedding (128px PNG)
  const logoDevToken = process.env.LOGO_DEV_TOKEN;
  if (logoDevToken && logoDevToken !== "your_logo_dev_token") {
    const url = `https://img.logo.dev/${domain}?token=${logoDevToken}&format=png&size=128`;
    const dataUrl = await downloadAsDataUrl(url);
    if (dataUrl) {
      console.log(`[L4 Download] ${domain} → Logo.dev ✓ (${dataUrl.length} chars)`);
      return { dataUrl, source: "logo.dev", theme: "light", width: 128 };
    }
    console.log(`[L4 Download] ${domain} → Logo.dev ✗ (404 or error)`);
  }

  // 2. Brandfetch CDN — download server-side (CDN blocks browser access but allows server GET)
  //    Prefer icon over logo, prefer light over dark
  const bfIcon = brandfetchLogos.find((l) => l.type === "icon" && l.theme === "light")
    ?? brandfetchLogos.find((l) => l.type === "icon")
    ?? brandfetchLogos.find((l) => l.theme === "light")
    ?? brandfetchLogos[0];

  if (bfIcon?.url) {
    const dataUrl = await downloadAsDataUrl(bfIcon.url);
    if (dataUrl) {
      console.log(`[L4 Download] ${domain} → Brandfetch ${bfIcon.type}/${bfIcon.theme} ✓ (${dataUrl.length} chars)`);
      return { dataUrl, source: "brandfetch", theme: bfIcon.theme, width: 400 };
    }
    console.log(`[L4 Download] ${domain} → Brandfetch ✗ (CDN error)`);
  }

  // 3. Google Favicons — universal coverage, always works (128px)
  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const googleDataUrl = await downloadAsDataUrl(googleUrl);
  if (googleDataUrl) {
    console.log(`[L4 Download] ${domain} → Google Favicon ✓ (${googleDataUrl.length} chars)`);
    return { dataUrl: googleDataUrl, source: "google", theme: "light", width: 128 };
  }

  console.log(`[L4 Download] ${domain} → All sources failed`);
  return null;
}

/**
 * Run all logo API sources: fetch Brandfetch data + download best logo.
 */
export async function fetchLogoApis(domain: string): Promise<{
  brandfetch: BrandfetchResult | null;
  downloadedLogo: DownloadedLogo | null;
}> {
  // Fetch Brandfetch first (we need its logo URLs to download from)
  const brandfetch = await fetchBrandfetch(domain).catch(() => null);

  // Download the best logo from any source
  const downloadedLogo = await downloadBestLogo(domain, brandfetch?.logos ?? []);

  return { brandfetch, downloadedLogo };
}
