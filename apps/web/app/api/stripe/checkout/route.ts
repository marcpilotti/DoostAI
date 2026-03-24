import { auth } from "@clerk/nextjs/server";

import { getStripe, PRICE_IDS } from "@/lib/stripe/client";
import { db, eq, organizations } from "@doost/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { plan, orgId } = (await req.json()) as {
    plan: "starter" | "pro" | "agency";
    orgId: string;
  };

  const priceId = PRICE_IDS[plan];
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
    return Response.json({ error: "Organization not found" }, { status: 404 });
  }

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
}
