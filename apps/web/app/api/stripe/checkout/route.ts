import { auth } from "@clerk/nextjs/server";
import { db, eq, organizations } from "@doost/db";

import { getStripe, PRICE_IDS } from "@/lib/stripe/client";

export async function POST(req: Request) {
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const plan = (body as Record<string, unknown>)?.plan;
  const orgId = (body as Record<string, unknown>)?.orgId;
  if (typeof plan !== "string" || typeof orgId !== "string" || !["starter", "pro", "agency"].includes(plan)) {
    return Response.json({ success: false, error: "Invalid plan or orgId" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan as "starter" | "pro" | "agency"];
  if (!priceId) {
    return Response.json(
      { error: `No Stripe price configured for plan: ${plan}` },
      { status: 400 },
    );
  }

  // Get or create Stripe customer
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

  try {
    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        name: org.name,
        metadata: { orgId: org.id, clerkOrgId: org.clerkOrgId },
      });
      customerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(organizations.id, orgId));
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
      metadata: { orgId: org.id },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
