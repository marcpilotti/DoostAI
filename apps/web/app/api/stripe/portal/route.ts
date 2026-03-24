import { auth } from "@clerk/nextjs/server";

import { getStripe } from "@/lib/stripe/client";
import { db, eq, organizations } from "@doost/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { orgId } = (await req.json()) as { orgId: string };

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appUrl}/settings/billing`,
  });

  return Response.json({ url: session.url });
}
