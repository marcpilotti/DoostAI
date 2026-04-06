/**
 * Build AI context for chat — the "brain" that makes the AI Panel know the customer.
 * Follows LIVING-PROFILE.md buildAIContext() spec.
 *
 * Injected as system message into every chat request so the AI
 * feels like a colleague who has worked with the customer for months.
 */

import { brandProfiles, campaigns, db, eq, and } from "@doost/db";

export type AIContextInput = {
  orgId: string;
  clerkOrgId?: string;
};

export async function buildAIContext(input: AIContextInput): Promise<string> {
  const { orgId } = input;

  // Load brand profile
  const [profile] = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.orgId, orgId))
    .limit(1);

  if (!profile) {
    return `Du är Doost AI, en marknadsföringsassistent för nordiska företag.
Användaren har inte analyserat något företag ännu. Hjälp dem att komma igång genom att be om deras hemsidas URL.
Svara på svenska om inte användaren skriver på engelska.`;
  }

  // Load active campaigns
  const activeCampaigns = await db
    .select({
      name: campaigns.name,
      status: campaigns.status,
      channels: campaigns.channels,
      performanceMetrics: campaigns.performanceMetrics,
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.orgId, orgId),
        eq(campaigns.brandProfileId, profile.id),
      ),
    )
    .limit(10);

  const behavior = profile.behaviorProfile;
  const performance = profile.performanceProfile;

  // Build context sections
  const sections: string[] = [];

  // Identity
  sections.push(`## Om kunden

Företag: ${profile.name} (${profile.industry ?? "okänd bransch"})
URL: ${profile.url}
${profile.employeeCount ? `${profile.employeeCount} anställda` : ""}
${profile.revenue ? `Omsättning: ${profile.revenue}` : ""}
${profile.location ? `Plats: ${profile.location}` : ""}
Profil: ${profile.profileCompleteness ?? 0}% komplett`);

  // Brand
  if (profile.brandVoice || profile.targetAudience) {
    sections.push(`## Varumärke

${profile.brandVoice ? `Ton: ${profile.brandVoice}` : ""}
${profile.targetAudience ? `Målgrupp: ${profile.targetAudience}` : ""}
${profile.valuePropositions?.length ? `USP:ar: ${profile.valuePropositions.join(", ")}` : ""}`);
  }

  // Preferences (from behavior tracking)
  if (behavior) {
    const b = behavior;
    sections.push(`## Preferenser (lärt från beteende)

${b.copyTone ? `Föredrar ${b.copyTone} ton i copy.` : ""}
${b.headlinePreference ? `Gillar ${b.headlinePreference === "shorter" ? "korta, punchiga" : b.headlinePreference === "longer" ? "längre, detaljerade" : "medellånga"} rubriker.` : ""}
${b.controlLevel ? `Kontrollnivå: ${b.controlLevel === "hands-off" ? "godkänner snabbt utan redigering" : b.controlLevel === "hands-on" ? "granskar och redigerar noga" : "lagom involverad"}.` : ""}
${b.preferredPlatforms?.length ? `Favorit-plattform: ${b.preferredPlatforms.join(", ")}` : ""}
${b.languagePreference ? `Vill ha annonser på ${b.languagePreference === "sv" ? "svenska" : "engelska"}.` : ""}`);
  }

  // Performance intelligence
  if (performance?.winningPatterns) {
    const w = performance.winningPatterns as Record<string, unknown>;
    sections.push(`## Vad som fungerar

${w.bestCTA ? `Bästa CTA: "${w.bestCTA}"` : ""}
${w.bestDay ? `Bästa dag: ${w.bestDay}` : ""}
${w.bestPlatform ? `Bästa plattform: ${w.bestPlatform}` : ""}`);
  }

  if (performance?.losingPatterns) {
    const l = performance.losingPatterns as Record<string, unknown>;
    const mistakes = l.commonMistakes;
    if (Array.isArray(mistakes) && mistakes.length > 0) {
      sections.push(`## Undvik
${mistakes.map((m: string) => `- ${m}`).join("\n")}`);
    }
  }

  // Active campaigns
  if (activeCampaigns.length > 0) {
    const campaignLines = activeCampaigns.map((c) => {
      const m = c.performanceMetrics;
      const metrics = m
        ? `ROAS ${m.roas ?? "?"}x, CTR ${m.ctr ?? "?"}%, Spend ${m.spend ?? 0} kr`
        : "inga data ännu";
      return `- ${c.name} (${c.status}): ${metrics}`;
    });
    sections.push(`## Aktiva kampanjer

${campaignLines.join("\n")}`);
  }

  // Instructions
  sections.push(`## Instruktioner

Använd denna kunskap naturligt. Säg inte "baserat på din profildata" — bara vet det, som en kollega som jobbat med dem i månader.
Om de ber om en ny kampanj, använd deras vinnande mönster.
Om deras prestanda sjunker, nämn det proaktivt.
Svara på svenska om inte användaren skriver på engelska.
${behavior?.copyTone ? `Matcha deras ton: ${behavior.copyTone}.` : ""}`);

  return sections.filter((s) => s.trim()).join("\n\n");
}
