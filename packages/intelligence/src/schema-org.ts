/**
 * Schema.org Structured Data Extraction.
 * Parses JSON-LD script blocks from HTML to extract authoritative
 * business information (name, description, industry, social URLs, etc.).
 *
 * No external dependencies — uses regex-based extraction.
 */

export type SchemaOrgData = {
  name?: string;
  description?: string;
  industry?: string;
  url?: string;
  logo?: string;
  telephone?: string;
  address?: { city?: string; country?: string };
  sameAs?: string[];
};

/**
 * Extract all JSON-LD blocks from HTML and parse Schema.org data.
 * Returns null if no usable structured data is found.
 */
export function extractSchemaOrg(html: string): SchemaOrgData | null {
  const jsonLdBlocks = extractJsonLdBlocks(html);
  if (jsonLdBlocks.length === 0) return null;

  // Flatten all entities from all blocks (handles @graph arrays)
  const entities = flattenEntities(jsonLdBlocks);
  if (entities.length === 0) return null;

  // Find the most relevant entity — prefer Organization/LocalBusiness over WebSite/Product
  const ranked = rankEntities(entities);
  if (ranked.length === 0) return null;

  // Merge data from ranked entities (higher-priority entity wins per field)
  return mergeEntities(ranked);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const JSON_LD_RE = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extract raw JSON-LD strings from HTML <script> tags. */
function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex for safety
  JSON_LD_RE.lastIndex = 0;

  while ((match = JSON_LD_RE.exec(html)) !== null) {
    const raw = match[1];
    if (!raw) continue;

    try {
      // Some sites include HTML entities or trailing commas — try to clean up
      const cleaned = raw
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();

      const parsed: unknown = JSON.parse(cleaned);
      blocks.push(parsed);
    } catch {
      // Broken JSON-LD — skip this block
    }
  }

  return blocks;
}

/** Schema.org types we care about, in priority order. */
const RELEVANT_TYPES = new Set([
  "Organization",
  "LocalBusiness",
  "Corporation",
  "Restaurant",
  "Store",
  "MedicalBusiness",
  "LegalService",
  "FinancialService",
  "RealEstateAgent",
  "WebSite",
  "Product",
  "SoftwareApplication",
]);

/**
 * Flatten JSON-LD blocks into individual entities.
 * Handles top-level objects, @graph arrays, and arrays of objects.
 */
function flattenEntities(blocks: unknown[]): Record<string, unknown>[] {
  const entities: Record<string, unknown>[] = [];

  for (const block of blocks) {
    if (block === null || typeof block !== "object") continue;

    if (Array.isArray(block)) {
      // Array of entities at the top level
      for (const item of block) {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          entities.push(item as Record<string, unknown>);
        }
      }
    } else {
      const obj = block as Record<string, unknown>;

      // Check for @graph array
      if (Array.isArray(obj["@graph"])) {
        for (const item of obj["@graph"]) {
          if (item !== null && typeof item === "object" && !Array.isArray(item)) {
            entities.push(item as Record<string, unknown>);
          }
        }
      }

      // Also include the top-level object itself (it may have @type)
      entities.push(obj);
    }
  }

  return entities;
}

/** Normalize @type to a string (handles arrays like ["Organization", "LocalBusiness"]). */
function getEntityType(entity: Record<string, unknown>): string | null {
  const raw = entity["@type"];
  if (typeof raw === "string") return stripSchemaPrefix(raw);
  if (Array.isArray(raw)) {
    // Return the first type that is a string
    for (const t of raw) {
      if (typeof t === "string") return stripSchemaPrefix(t);
    }
  }
  return null;
}

function stripSchemaPrefix(type: string): string {
  return type.replace(/^https?:\/\/schema\.org\//, "");
}

/** Priority for entity types — lower number = higher priority. */
function typePriority(type: string | null): number {
  if (!type) return 999;
  // Organization-like types get highest priority
  if (["Organization", "Corporation", "LocalBusiness", "Restaurant", "Store",
    "MedicalBusiness", "LegalService", "FinancialService", "RealEstateAgent"].includes(type)) {
    return 1;
  }
  if (type === "WebSite") return 2;
  if (["Product", "SoftwareApplication"].includes(type)) return 3;
  return 999;
}

/** Rank entities by relevance. Only keeps entities with recognized types. */
function rankEntities(entities: Record<string, unknown>[]): Record<string, unknown>[] {
  return entities
    .filter((e) => {
      const type = getEntityType(e);
      return type !== null && RELEVANT_TYPES.has(type);
    })
    .sort((a, b) => typePriority(getEntityType(a)) - typePriority(getEntityType(b)));
}

/** Safely extract a string value from an entity field. */
function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return undefined;
}

/** Safely extract a string from a field that might be an object with @value or name. */
function strOrNested(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return str(obj["@value"]) ?? str(obj["name"]);
  }
  return undefined;
}

/** Extract logo URL from logo field (can be string, object with url, or ImageObject). */
function extractLogo(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return str(obj["url"]) ?? str(obj["contentUrl"]);
  }
  return undefined;
}

/** Extract industry from naicsCode, category, or industry fields. */
function extractIndustry(entity: Record<string, unknown>): string | undefined {
  // Try direct industry field
  const industry = strOrNested(entity["industry"]);
  if (industry) return industry;

  // Try category
  const category = str(entity["category"]);
  if (category) return category;

  // Try naicsCode — this is a numeric code, not very useful as-is,
  // but we store it in case we want to map it later
  const naics = str(entity["naicsCode"]);
  if (naics) return `NAICS:${naics}`;

  return undefined;
}

/** Extract address from PostalAddress or embedded address object. */
function extractAddress(value: unknown): { city?: string; country?: string } | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;
  const city = str(obj["addressLocality"]) ?? str(obj["addressRegion"]);
  const country = str(obj["addressCountry"]);
  // addressCountry can be a nested object like { "@type": "Country", "name": "Sweden" }
  const countryStr = country ?? strOrNested(obj["addressCountry"]);
  if (!city && !countryStr) return undefined;
  return { city, country: countryStr };
}

/** Extract sameAs URLs (social media profiles). */
function extractSameAs(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.startsWith("http"));
  }
  return [];
}

/**
 * Merge multiple entities into a single SchemaOrgData.
 * First entity in the array has highest priority per field.
 */
function mergeEntities(entities: Record<string, unknown>[]): SchemaOrgData | null {
  const result: SchemaOrgData = {};
  const allSameAs: string[] = [];

  for (const entity of entities) {
    if (!result.name) result.name = strOrNested(entity["name"]);
    if (!result.description) result.description = str(entity["description"]);
    if (!result.industry) result.industry = extractIndustry(entity);
    if (!result.url) result.url = str(entity["url"]);
    if (!result.logo) result.logo = extractLogo(entity["logo"]) ?? extractLogo(entity["image"]);
    if (!result.telephone) result.telephone = str(entity["telephone"]);
    if (!result.address) result.address = extractAddress(entity["address"]);

    // Collect all sameAs URLs from all entities
    allSameAs.push(...extractSameAs(entity["sameAs"]));
  }

  // Deduplicate sameAs
  if (allSameAs.length > 0) {
    result.sameAs = [...new Set(allSameAs)];
  }

  // Only return if we found at least one useful field
  const hasData = result.name ?? result.description ?? result.industry ??
    result.url ?? result.logo ?? result.sameAs;
  return hasData ? result : null;
}
