import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe/client";
import { db, eq, organizations } from "@doost/db";

/**
 * POST /api/stripe/setup-intent
 *
 * Creates a Stripe SetupIntent for Level 2 registration (card on file).
 * No charge — just saves the payment method for future use.
 * Enables the 14-day free trial.
 */
export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const requestOrgId = (body as { orgId?: string }).orgId ?? orgId;

  if (!requestOrgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const stripe = getStripe();

  // Find or create Stripe customer
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, requestOrgId))
    .limit(1);

  let customerId = org?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { orgId: requestOrgId, clerkUserId: userId },
    });
    customerId = customer.id;

    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(organizations.id, requestOrgId));
  }

  // Create SetupIntent — no charge, just saves the card
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: {
      orgId: requestOrgId,
      purpose: "trial_activation",
    },
  });

  // Start 14-day trial
  await db
    .update(organizations)
    .set({
      plan: "starter",
      metadata: {
        ...(org?.metadata as Record<string, unknown> ?? {}),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, requestOrgId));

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    customerId,
  });
}
