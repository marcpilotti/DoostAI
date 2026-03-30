/**
 * Industry-Driven Dynamic Background Injection
 *
 * Maps each industry category (from @doost/ai mappings) to a set of
 * Unsplash search terms. Used by background-service.ts to fetch
 * relevant stock photography for ad creative backgrounds.
 *
 * Categories match both the SNI_TO_CATEGORY values in packages/ai and
 * the broader set specified in CLAUDE.md. Fallback terms are provided
 * for unknown industries.
 */

export const INDUSTRY_BACKGROUNDS: Record<string, string[]> = {
  // --- Categories from SNI_TO_CATEGORY in packages/ai/src/mappings.ts ---
  "VVS & Bygg": [
    "modern architecture",
    "construction site aerial",
    "city skyline",
    "building renovation",
    "plumbing tools",
  ],
  "B2B SaaS": [
    "abstract technology",
    "code screen dark",
    "saas dashboard",
    "digital network",
    "cloud computing",
  ],
  Restaurang: [
    "restaurant interior",
    "food plating fine dining",
    "cafe atmosphere",
    "chef cooking",
    "bar counter",
  ],
  "E-handel": [
    "ecommerce packaging",
    "online shopping",
    "delivery boxes",
    "product photography flat lay",
    "shopping cart",
  ],
  "Hälsa": [
    "medical office clean",
    "healthcare professional",
    "wellness spa",
    "yoga meditation",
    "pharmacy",
  ],
  Juridik: [
    "law office",
    "legal books library",
    "courtroom",
    "business meeting formal",
    "gavel justice",
  ],
  Utbildning: [
    "classroom modern",
    "library books",
    "students university",
    "online learning",
    "campus aerial",
  ],
  Rekrytering: [
    "job interview",
    "office team collaboration",
    "handshake business",
    "recruitment fair",
    "professional headshot",
  ],
  Fastigheter: [
    "modern apartment interior",
    "real estate exterior",
    "city skyline sunset",
    "luxury home",
    "architecture minimal",
  ],
  "Marknadsföring": [
    "creative agency office",
    "social media marketing",
    "photography studio",
    "branding design",
    "digital advertising",
  ],
  "Transport & Logistik": [
    "logistics warehouse",
    "cargo ship aerial",
    "highway aerial",
    "delivery truck",
    "supply chain",
  ],

  // --- Extended categories from CLAUDE.md / broader market ---
  "IT & Tech": [
    "abstract technology",
    "code screen dark",
    "server room",
    "digital network",
    "circuit board macro",
  ],
  "Hotell & Restaurang": [
    "hotel lobby luxury",
    "restaurant interior warm",
    "food plating",
    "boutique hotel room",
    "cocktail bar",
  ],
  "Bygg & Fastigheter": [
    "modern architecture",
    "construction site",
    "city skyline",
    "building renovation",
    "real estate exterior",
  ],
  "Hälsa & Sjukvård": [
    "medical office clean",
    "healthcare professional",
    "wellness spa",
    "hospital modern",
    "stethoscope",
  ],
  "Finans & Försäkring": [
    "financial district",
    "stock market data",
    "business meeting",
    "bank building",
    "investment chart",
  ],
  "Mode & Skönhet": [
    "fashion photography editorial",
    "beauty products flat lay",
    "runway fashion",
    "makeup close-up",
    "clothing store",
  ],
  "Träning & Fritid": [
    "gym workout",
    "outdoor sports nature",
    "yoga studio",
    "running trail",
    "fitness equipment",
  ],
  "Fordon & Transport": [
    "car showroom",
    "automotive photography",
    "highway aerial",
    "electric vehicle",
    "car dashboard",
  ],
  "Konsult & Rådgivning": [
    "business consulting meeting",
    "office whiteboard strategy",
    "professional workspace",
    "conference room",
    "laptop presentation",
  ],
  "Tillverkning & Industri": [
    "factory floor modern",
    "manufacturing assembly",
    "industrial machinery",
    "warehouse logistics",
    "cnc machine",
  ],
  "Juridik & Redovisning": [
    "law office",
    "legal books library",
    "accounting office",
    "financial documents",
    "courtroom",
  ],
  "Livsmedel & Dagligvaror": [
    "grocery store modern",
    "fresh produce market",
    "bakery artisan",
    "food packaging",
    "organic farm",
  ],
  "Marknadsföring & Media": [
    "creative agency",
    "social media marketing",
    "photography studio",
    "video production",
    "podcast studio",
  ],
  "Rekrytering & Bemanning": [
    "job interview professional",
    "office team diverse",
    "handshake business",
    "coworking space",
    "career fair",
  ],
  "Energi & Miljö": [
    "solar panels aerial",
    "wind turbines landscape",
    "green nature forest",
    "renewable energy",
    "electric charging",
  ],
  "Kultur & Nöje": [
    "concert stage lights",
    "art gallery minimal",
    "theater performance",
    "museum exhibition",
    "music festival",
  ],
  "SaaS & Molntjänster": [
    "cloud computing abstract",
    "dashboard screen mockup",
    "saas interface",
    "data center",
    "technology office",
  ],
  Detaljhandel: [
    "retail store interior",
    "shopping street european",
    "storefront window",
    "boutique shop",
    "retail display",
  ],
};

/**
 * Fallback search terms for industries not in the mapping.
 * Generic business/professional imagery that works for any vertical.
 */
export const DEFAULT_BACKGROUND_TERMS: string[] = [
  "professional office",
  "business abstract",
  "modern workspace",
  "corporate meeting",
  "minimalist desk",
];

/**
 * Get search terms for a given industry string.
 * Tries exact match first, then case-insensitive partial match,
 * then falls back to generic terms.
 */
export function getBackgroundTerms(industry: string): string[] {
  // Exact match
  if (INDUSTRY_BACKGROUNDS[industry]) {
    return INDUSTRY_BACKGROUNDS[industry];
  }

  // Case-insensitive match
  const lower = industry.toLowerCase();
  for (const [key, terms] of Object.entries(INDUSTRY_BACKGROUNDS)) {
    if (key.toLowerCase() === lower) {
      return terms;
    }
  }

  // Partial match — check if the industry string contains a known key or vice versa
  for (const [key, terms] of Object.entries(INDUSTRY_BACKGROUNDS)) {
    if (
      lower.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lower)
    ) {
      return terms;
    }
  }

  return DEFAULT_BACKGROUND_TERMS;
}
