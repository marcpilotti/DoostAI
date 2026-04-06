import { auth } from "@clerk/nextjs/server";
import { db, eq, organizations } from "@doost/db";

import { getStripe } from "@/lib/stripe/client";

export async function POST(req: Request) {
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const orgId = (body as Record<string, unknown>)?.orgId;
  if (typeof orgId !== "string") {
    return Response.json({ error: "Invalid orgId" }, { status: 400 });
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return Response.json({ success: false, error: "Organization not found" }, { status: 404 });
  }

  // Verify the authenticated user owns this organization
  if (clerkOrgId && org.clerkOrgId !== clerkOrgId) {
    return Response.json({ success: false, error: "Not authorized for this organization" }, { status: 403 });
  }

  if (!org.stripeCustomerId) {
    return Response.json({ success: false, error: "No Stripe customer found" }, { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal] Error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
