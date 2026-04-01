import { brandProfiles, db, eq } from "@doost/db";

import { inngest } from "../client";

export const creativesPreRender = inngest.createFunction(
  {
    id: "creatives-pre-render",
    triggers: [{ event: "brand/complete" }],
  },
  async ({ event, step }) => {
    const { profileId, orgId, name } = event.data as {
      profileId: string;
      orgId: string;
      name: string;
    };

    // Fetch brand profile for colors/fonts/logo
    const profile = await step.run("fetch-profile", async () => {
      const [bp] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.id, profileId))
        .limit(1);
      return bp ?? null;
    });

    if (!profile) return { profileId, templatesRendered: 0 };

    const colors = (profile.colors ?? {}) as Record<string, string>;
    const fonts = (profile.fonts ?? {}) as Record<string, string>;
    const logos = (profile.logos ?? {}) as Record<string, string>;

    const brand = {
      name: profile.name ?? name,
      colors: {
        primary: colors.primary ?? "#6366f1",
        secondary: colors.secondary ?? "#4f46e5",
        accent: colors.accent ?? "#10b981",
        background: colors.background ?? "#ffffff",
        text: colors.text ?? "#1a1a1a",
      },
      fonts: {
        heading: fonts.heading ?? "Inter",
        body: fonts.body ?? "Inter",
      },
      logos: {
        primary: logos.primary,
        icon: logos.icon,
        dark: logos.dark,
      },
    };

    const platforms = ["meta", "google", "linkedin"] as const;
    let rendered = 0;

    for (const platform of platforms) {
      await step.run(`render-${platform}`, async () => {
        try {
          // Dynamic imports to avoid bundling native modules at build time
          const { getTemplatesForPlatform, renderToImage } = await import("@doost/templates");
          const { uploadToR2 } = await import("@/lib/r2/client");

          const templates = getTemplatesForPlatform(platform);
          if (!templates || templates.length === 0) return;

          // Render first 2 templates per platform with placeholder copy
          for (const template of templates.slice(0, 2)) {
            const content = {
              headline: `${brand.name} — din partner`,
              bodyCopy: "Placeholder för förhandsvisning",
              cta: "Läs mer",
            };

            const imageBuffer = await renderToImage(template, brand, content);
            const key = `previews/${orgId}/${profileId}/${platform}-${template.id ?? rendered}.png`;
            await uploadToR2(key, imageBuffer);
            rendered++;
          }
        } catch (err) {
          console.error(`[pre-render] Failed for ${platform}:`, err instanceof Error ? err.message : err);
        }
      });
    }

    return { profileId, templatesRendered: rendered };
  },
);
