import { GoogleExtended } from "./google/extended";
import { GoogleStandard } from "./google/standard";
import { LinkedInCorporate } from "./linkedin/corporate";
import { LinkedInInsight } from "./linkedin/insight";
import { MetaMinimal } from "./meta/minimal";
import { MetaSplit } from "./meta/split";
import type { Platform, Template } from "./types";

export const templates: Template[] = [
  {
    id: "meta-minimal",
    name: "Minimal",
    platform: "meta",
    format: "meta_feed",
    category: "minimal",
    width: 1080,
    height: 1080,
    render: MetaMinimal,
  },
  {
    id: "meta-split",
    name: "Split",
    platform: "meta",
    format: "meta_feed",
    category: "bold",
    width: 1080,
    height: 1080,
    render: MetaSplit,
  },
  {
    id: "google-standard",
    name: "Standard Search",
    platform: "google",
    format: "google_search",
    category: "standard",
    width: 600,
    height: 200,
    render: GoogleStandard,
  },
  {
    id: "google-extended",
    name: "Extended Search",
    platform: "google",
    format: "google_search",
    category: "extended",
    width: 600,
    height: 260,
    render: GoogleExtended,
  },
  {
    id: "linkedin-corporate",
    name: "Corporate",
    platform: "linkedin",
    format: "linkedin_sponsored",
    category: "corporate",
    width: 1200,
    height: 627,
    render: LinkedInCorporate,
  },
  {
    id: "linkedin-insight",
    name: "Insight Report",
    platform: "linkedin",
    format: "linkedin_sponsored",
    category: "insight",
    width: 1200,
    height: 627,
    render: LinkedInInsight,
  },
];

const byId = new Map(templates.map((t) => [t.id, t]));

export function getTemplate(id: string): Template | undefined {
  return byId.get(id);
}

export function getTemplatesForPlatform(platform: Platform): Template[] {
  return templates.filter((t) => t.platform === platform);
}
