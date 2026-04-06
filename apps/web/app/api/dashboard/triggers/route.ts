import { auth } from "@clerk/nextjs/server";
import { db, desc,eq, organizations, profileTriggers } from "@doost/db";

/**
 * GET /api/dashboard/triggers
 * Returns recent unfired trigger notifications for the current org.
 */
export async function GET() {
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId || !clerkOrgId) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get internal org ID
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.clerkOrgId, clerkOrgId))
      .limit(1);

    if (!org) {
      return Response.json({ triggers: [] });
    }

    // Get recent trigger notifications (last 7 days, not yet acted on)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const triggers = await db
      .select({
        id: profileTriggers.id,
        triggerId: profileTriggers.triggerId,
        triggerData: profileTriggers.triggerData,
        userActed: profileTriggers.userActed,
        firedAt: profileTriggers.firedAt,
      })
      .from(profileTriggers)
      .where(eq(profileTriggers.orgId, org.id))
      .orderBy(desc(profileTriggers.firedAt))
      .limit(5);

    const notifications = triggers
      .filter((t) => !t.userActed && t.firedAt >= sevenDaysAgo)
      .map((t) => {
        const data = t.triggerData as { title?: string; body?: string; type?: string; priority?: string } | null;
        return {
          id: t.id,
          title: data?.title ?? t.triggerId,
          body: data?.body ?? "",
          type: data?.type ?? t.triggerId,
          priority: (data?.priority ?? "medium") as "low" | "medium" | "high",
        };
      });

    return Response.json({ triggers: notifications });
  } catch {
    return Response.json({ triggers: [] });
  }
}
