import { auth } from "@clerk/nextjs/server";
import { db, eq, organizations } from "@doost/db";

import { getStripe } from "@/lib/stripe/client";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
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

  if (!org?.stripeCustomerId) {
    return Response.json(
      { error: "No Stripe customer found" },
      { status: 400 },
    );
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
