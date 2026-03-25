import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums ---

export const planEnum = pgEnum("plan", ["free", "starter", "pro", "agency"]);
export const platformEnum = pgEnum("platform", ["meta", "google", "linkedin"]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "generating",
  "review",
  "publishing",
  "live",
  "paused",
  "completed",
  "failed",
]);
export const creativeTypeEnum = pgEnum("creative_type", [
  "image",
  "video",
  "text_only",
  "carousel",
]);
export const adFormatEnum = pgEnum("ad_format", [
  "meta_feed",
  "meta_story",
  "meta_reel",
  "google_search",
  "google_display",
  "google_pmax",
  "linkedin_sponsored",
  "linkedin_message",
]);
export const accountStatusEnum = pgEnum("account_status", [
  "pending",
  "active",
  "disconnected",
  "error",
]);

// --- Organizations (tenants) ---

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkOrgId: text("clerk_org_id").notNull().unique(),
    name: text("name").notNull(),
    plan: planEnum("plan").notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    metadata: jsonb("metadata").$type<{
      onboardingCompleted?: boolean;
      trialEndsAt?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("org_clerk_idx").on(t.clerkOrgId)],
);

// --- Brand Profiles ---

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    industry: text("industry"),
    industryCodes: jsonb("industry_codes").$type<string[]>(),
    employeeCount: integer("employee_count"),
    revenue: text("revenue"),
    location: text("location"),
    ceo: text("ceo"),
    orgNumber: text("org_number"),
    colors: jsonb("colors").$type<{
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    }>(),
    fonts: jsonb("fonts").$type<{
      heading: string;
      body: string;
    }>(),
    logos: jsonb("logos").$type<{
      primary?: string;
      icon?: string;
      dark?: string;
    }>(),
    brandVoice: text("brand_voice"),
    targetAudience: text("target_audience"),
    valuePropositions: jsonb("value_propositions").$type<string[]>(),
    competitors: jsonb("competitors").$type<string[]>(),
    rawScrapeData: jsonb("raw_scrape_data"),
    rawEnrichmentData: jsonb("raw_enrichment_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("brand_org_idx").on(t.orgId)],
);

// --- Ad Accounts (platform connections) ---

export const adAccounts = pgTable(
  "ad_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    platformAccountId: text("platform_account_id").notNull(),
    name: text("name"),
    status: accountStatusEnum("status").notNull().default("pending"),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at"),
    tokenIv: text("token_iv"),
    scopes: jsonb("scopes").$type<string[]>(),
    metadata: jsonb("metadata").$type<{
      businessManagerId?: string;
      mccCustomerId?: string;
      pageId?: string;
      refreshTokenIv?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("ad_account_org_idx").on(t.orgId),
    uniqueIndex("ad_account_platform_idx").on(
      t.orgId,
      t.platform,
      t.platformAccountId,
    ),
  ],
);

// --- Campaigns ---

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    brandProfileId: uuid("brand_profile_id")
      .notNull()
      .references(() => brandProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: campaignStatusEnum("status").notNull().default("draft"),
    objective: text("objective"),
    channels: jsonb("channels")
      .$type<Array<"meta" | "google" | "linkedin">>()
      .notNull()
      .default([]),
    budget: jsonb("budget").$type<{
      daily?: number;
      total?: number;
      currency: string;
    }>(),
    schedule: jsonb("schedule").$type<{
      startDate?: string;
      endDate?: string;
      isOngoing?: boolean;
    }>(),
    targeting: jsonb("targeting").$type<{
      locations?: string[];
      ageRange?: { min: number; max: number };
      interests?: string[];
      jobTitles?: string[];
      industries?: string[];
      companySize?: string[];
    }>(),
    performanceMetrics: jsonb("performance_metrics").$type<{
      impressions?: number;
      clicks?: number;
      conversions?: number;
      spend?: number;
      ctr?: number;
      cpc?: number;
      roas?: number;
      lastUpdated?: string;
    }>(),
    platformCampaignIds: jsonb("platform_campaign_ids").$type<{
      meta?: string;
      google?: string;
      linkedin?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("campaign_org_idx").on(t.orgId),
    index("campaign_brand_idx").on(t.brandProfileId),
    index("campaign_status_idx").on(t.status),
  ],
);

// --- Ad Creatives ---

export const adCreatives = pgTable(
  "ad_creatives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    templateId: text("template_id"),
    type: creativeTypeEnum("type").notNull().default("image"),
    format: adFormatEnum("format").notNull(),
    platform: platformEnum("platform").notNull(),
    headline: text("headline"),
    bodyCopy: text("body_copy"),
    cta: text("cta"),
    imageUrl: text("image_url"),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    platformAdId: text("platform_ad_id"),
    performanceScore: numeric("performance_score"),
    performance: jsonb("performance").$type<{
      impressions?: number;
      clicks?: number;
      conversions?: number;
      ctr?: number;
      cpc?: number;
      date?: string;
    }>(),
    variants: jsonb("variants").$type<
      Array<{
        id: string;
        headline: string;
        bodyCopy: string;
        isWinner?: boolean;
      }>
    >(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("creative_campaign_idx").on(t.campaignId),
    index("creative_org_idx").on(t.orgId),
    index("creative_platform_idx").on(t.platform),
  ],
);

// --- Conversations (chat history) ---

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title"),
    messages: jsonb("messages")
      .$type<
        Array<{
          id: string;
          role: "user" | "assistant" | "system" | "tool";
          content: string;
          toolCalls?: Array<{
            id: string;
            name: string;
            args: Record<string, unknown>;
            result?: unknown;
          }>;
          createdAt: string;
        }>
      >()
      .notNull()
      .default([]),
    context: jsonb("context").$type<{
      brandProfileId?: string;
      campaignId?: string;
      currentStep?: string;
    }>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("conversation_org_idx").on(t.orgId),
    index("conversation_active_idx").on(t.orgId, t.isActive),
  ],
);

// --- Creative Performance (time-series) ---

export const creativePerformance = pgTable(
  "creative_performance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    creativeId: uuid("creative_id")
      .notNull()
      .references(() => adCreatives.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    date: timestamp("date").notNull(),
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),
    conversions: integer("conversions").default(0),
    spend: numeric("spend").default("0"),
    ctr: numeric("ctr"),
    cpc: numeric("cpc"),
    cpm: numeric("cpm"),
    roas: numeric("roas"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("perf_creative_idx").on(t.creativeId),
    index("perf_org_date_idx").on(t.orgId, t.date),
    index("perf_platform_date_idx").on(t.platform, t.date),
  ],
);

// --- Ad Templates ---

export const adTemplates = pgTable("ad_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  platform: platformEnum("platform").notNull(),
  format: adFormatEnum("format").notNull(),
  category: text("category"),
  industry: text("industry"),
  htmlTemplate: text("html_template").notNull(),
  cssTemplate: text("css_template"),
  previewUrl: text("preview_url"),
  variables: jsonb("variables").$type<
    Array<{
      name: string;
      type: "text" | "color" | "image" | "logo";
      required: boolean;
      defaultValue?: string;
    }>
  >(),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").default(0),
  avgPerformanceScore: numeric("avg_performance_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Relations ---

export const organizationRelations = relations(organizations, ({ many }) => ({
  brandProfiles: many(brandProfiles),
  adAccounts: many(adAccounts),
  campaigns: many(campaigns),
  conversations: many(conversations),
}));

export const brandProfileRelations = relations(
  brandProfiles,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [brandProfiles.orgId],
      references: [organizations.id],
    }),
    campaigns: many(campaigns),
  }),
);

export const campaignRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [campaigns.orgId],
    references: [organizations.id],
  }),
  brandProfile: one(brandProfiles, {
    fields: [campaigns.brandProfileId],
    references: [brandProfiles.id],
  }),
  creatives: many(adCreatives),
}));

export const adCreativeRelations = relations(adCreatives, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [adCreatives.campaignId],
    references: [campaigns.id],
  }),
  performance: many(creativePerformance),
}));

export const creativePerformanceRelations = relations(
  creativePerformance,
  ({ one }) => ({
    creative: one(adCreatives, {
      fields: [creativePerformance.creativeId],
      references: [adCreatives.id],
    }),
  }),
);
