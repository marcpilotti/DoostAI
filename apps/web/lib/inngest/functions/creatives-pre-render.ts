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

    await step.run("pre-render-templates", async () => {
      // Pre-render all 6 templates with brand colors + placeholder copy
      // This ensures Stage 5 has instant previews available
      // TODO: Import templates registry and render to R2
      console.log(
        `Pre-rendering 6 templates for brand ${name} (${profileId})`,
      );
    });

    return { profileId, templatesRendered: 6 };
  },
);
