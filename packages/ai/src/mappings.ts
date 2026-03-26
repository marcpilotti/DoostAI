/**
 * Industry, goal, font, and budget mappings for Doost AI.
 * Used across the pipeline for bransch-specific defaults.
 */

// ── SNI-kod → Doost branschkategori ─────────────────────────────
export const SNI_TO_CATEGORY: Record<string, string> = {
  // Bygg & VVS
  "43": "VVS & Bygg", "41": "VVS & Bygg", "42": "VVS & Bygg",
  "43210": "VVS & Bygg", "43220": "VVS & Bygg",
  // IT & SaaS
  "62": "B2B SaaS", "62010": "B2B SaaS", "62020": "B2B SaaS",
  "63": "B2B SaaS", "58": "B2B SaaS",
  // Restaurang
  "56": "Restaurang", "55": "Restaurang",
  // E-handel
  "47": "E-handel", "47910": "E-handel",
  // Hälsa
  "86": "Hälsa", "87": "Hälsa", "96": "Hälsa",
  // Juridik
  "69": "Juridik", "69100": "Juridik",
  // Utbildning
  "85": "Utbildning",
  // Rekrytering
  "78": "Rekrytering",
  // Fastigheter
  "68": "Fastigheter",
  // Marknadsföring
  "73": "Marknadsföring",
  // Transport
  "49": "Transport & Logistik", "50": "Transport & Logistik", "52": "Transport & Logistik",
};

export function sniToCategory(sniCode?: string): string | null {
  if (!sniCode) return null;
  // Try exact match first, then prefix
  if (SNI_TO_CATEGORY[sniCode]) return SNI_TO_CATEGORY[sniCode]!;
  const prefix2 = sniCode.slice(0, 2);
  return SNI_TO_CATEGORY[prefix2] ?? null;
}

// ── Branschpaletter (fallback-färger) ───────────────────────────
export const INDUSTRY_PALETTES: Record<string, { primary: string; secondary: string; accent: string }> = {
  "VVS & Bygg":          { primary: "#1a4a7a", secondary: "#f0f0f0", accent: "#d85a30" },
  "B2B SaaS":            { primary: "#0C447C", secondary: "#ffffff", accent: "#1D9E75" },
  "Restaurang":          { primary: "#7a1a1a", secondary: "#f5f0e8", accent: "#ba7517" },
  "E-handel":            { primary: "#1a1a2e", secondary: "#ffffff", accent: "#e94560" },
  "Hälsa":               { primary: "#D4537E", secondary: "#fbeaf0", accent: "#1D9E75" },
  "Juridik":             { primary: "#042C53", secondary: "#e6f1fb", accent: "#ba7517" },
  "Utbildning":          { primary: "#27500A", secondary: "#eaf3de", accent: "#378ADD" },
  "Rekrytering":         { primary: "#2d3748", secondary: "#f7fafc", accent: "#4299e1" },
  "Fastigheter":         { primary: "#1a365d", secondary: "#f0f5ff", accent: "#c6a96c" },
  "Marknadsföring":      { primary: "#6b21a8", secondary: "#faf5ff", accent: "#f59e0b" },
  "Transport & Logistik": { primary: "#064e3b", secondary: "#ecfdf5", accent: "#f97316" },
};

// ── Mål → Plattformsmappning ────────────────────────────────────
export type GoalMapping = {
  meta_objective: string;
  google_type: string;
  cta: string;
};

export const GOAL_MAPPINGS: Record<string, GoalMapping> = {
  "Fler kunder":    { meta_objective: "LEAD_GENERATION",  google_type: "SEARCH_DISPLAY", cta: "CONTACT_US" },
  "Hitta personal": { meta_objective: "TRAFFIC",          google_type: "SEARCH",         cta: "APPLY_NOW" },
  "Lansera nytt":   { meta_objective: "AWARENESS",        google_type: "DISPLAY_YOUTUBE", cta: "LEARN_MORE" },
  "Synas mer":      { meta_objective: "AWARENESS",        google_type: "DISPLAY",         cta: "LEARN_MORE" },
};

// ── Branschanpassade målgrupper ──────────────────────────────────
export const INDUSTRY_AUDIENCES: Record<string, string[]> = {
  "VVS & Bygg":     ["Fastighetsbolag", "Privatpersoner", "Byggföretag", "BRF:er"],
  "B2B SaaS":       ["IT-chefer", "VD:ar & Founders", "HR-chefer", "CFO:er"],
  "Restaurang":     ["Lokala invånare", "Turister", "Företagsluncher", "Eventplanerare"],
  "E-handel":       ["Millennials", "Föräldrar", "Presentköpare", "Återkommande kunder"],
  "Juridik":        ["Småföretag", "Fastighetsägare", "Privatpersoner", "Startups"],
  "Hälsa":          ["Privatpersoner 25–45", "Hälsomedvetna", "Företag (friskvård)", "Seniorer"],
  "Utbildning":     ["Föräldrar", "Studenter", "HR-avdelningar", "Yrkesverksamma"],
  "Rekrytering":    ["HR-chefer", "VD:ar", "Rekryteringsansvariga", "Teamleads"],
  "Fastigheter":    ["Bostadsköpare", "Investerare", "Hyresgäster", "Företag"],
  "Marknadsföring": ["Marknadschefer", "E-handlare", "Småföretagare", "Startups"],
  "Transport & Logistik": ["E-handlare", "Tillverkare", "Importörer", "Återförsäljare"],
};

// ── Branschanpassade budgetdefaults (SEK/mån) ───────────────────
export const INDUSTRY_BUDGETS: Record<string, { low: number; mid: number; high: number }> = {
  "VVS & Bygg":     { low: 2000, mid: 5000,  high: 10000 },
  "B2B SaaS":       { low: 3000, mid: 7000,  high: 15000 },
  "Restaurang":     { low: 1000, mid: 3000,  high: 6000 },
  "E-handel":       { low: 1500, mid: 4000,  high: 8000 },
  "Hälsa":          { low: 1500, mid: 4000,  high: 8000 },
  "Juridik":        { low: 2000, mid: 5000,  high: 12000 },
  "Utbildning":     { low: 1000, mid: 3000,  high: 7000 },
  "Rekrytering":    { low: 2000, mid: 5000,  high: 10000 },
  "Fastigheter":    { low: 2500, mid: 6000,  high: 12000 },
  "Marknadsföring": { low: 2000, mid: 5000,  high: 10000 },
  "Transport & Logistik": { low: 1500, mid: 4000, high: 8000 },
};

// Default for unknown industries
export const DEFAULT_BUDGETS = { low: 1500, mid: 4000, high: 8000 };

// ── Font-mappning (CSS → Google Fonts) ──────────────────────────
export const FONT_MAPPING: Record<string, string> = {
  "helvetica": "Inter",
  "helvetica neue": "Inter",
  "arial": "Inter",
  "proxima nova": "Montserrat",
  "avenir": "Nunito Sans",
  "avenir next": "Nunito Sans",
  "futura": "Poppins",
  "georgia": "Lora",
  "times new roman": "Lora",
  "times": "Lora",
  "trebuchet ms": "Source Sans Pro",
  "verdana": "Open Sans",
  "tahoma": "Open Sans",
  "segoe ui": "Inter",
  "roboto": "Roboto",
  "open sans": "Open Sans",
  "lato": "Lato",
  "montserrat": "Montserrat",
  "poppins": "Poppins",
  "inter": "Inter",
  "nunito": "Nunito",
  "raleway": "Raleway",
  "playfair display": "Playfair Display",
  "merriweather": "Merriweather",
  "dm sans": "DM Sans",
  "space grotesk": "Space Grotesk",
  "instrument sans": "Instrument Sans",
};

export function mapFontToGoogle(cssFont: string): string {
  const lower = cssFont.toLowerCase().trim().replace(/['"]/g, "");
  return FONT_MAPPING[lower] ?? cssFont;
}
