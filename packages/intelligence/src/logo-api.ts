/**
 * L4: Logo extraction via Brandfetch and Clearbit APIs.
 * Returns logo URL, brand colors, and fonts from authoritative sources.
 */

export type BrandfetchResult = {
  logos: { url: string; type: string; theme: string }[];
  colors: { hex: string; type: string }[];
  fonts: { name: string; weight: number; type: string }[];
  confidence: number;
};

/**
 * Brandfetch API — returns logo, colors, and fonts.
 * $75/month plan required for production.
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

    const logos = (data.logos ?? []).flatMap((logo) =>
      (logo.formats ?? [])
        .filter((f) => f.format === "svg" || f.format === "png")
        .map((f) => ({ url: f.src, type: logo.type ?? "logo", theme: logo.theme ?? "light" }))
    );

    const colors = (data.colors ?? []).map((c) => ({
      hex: c.hex,
      type: c.type ?? "brand",
    }));

    const fonts = (data.fonts ?? []).map((f) => ({
      name: f.name,
      weight: f.weight ?? 400,
      type: f.type ?? "body",
    }));

    return {
      logos,
      colors,
      fonts,
      confidence: 95,
    };
  } catch (err) {
    console.warn("[L4 Brandfetch] Failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Logo.dev API — simple domain-based logo lookup.
 * Free tier: 500k requests/month. No npm package needed.
 */
async function fetchLogoDev(domain: string): Promise<string | null> {
  const token = process.env.LOGO_DEV_TOKEN;
  if (!token || token === "your_logo_dev_token") return null;

  try {
    const url = `https://img.logo.dev/${domain}?token=${token}&format=png&size=256`;
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

/**
 * Run all logo API sources in parallel.
 */
export async function fetchLogoApis(domain: string): Promise<{
  brandfetch: BrandfetchResult | null;
  logoDevUrl: string | null;
}> {
  const [brandfetch, logoDevUrl] = await Promise.allSettled([
    fetchBrandfetch(domain),
    fetchLogoDev(domain),
  ]);

  return {
    brandfetch: brandfetch.status === "fulfilled" ? brandfetch.value : null,
    logoDevUrl: logoDevUrl.status === "fulfilled" ? logoDevUrl.value : null,
  };
}
