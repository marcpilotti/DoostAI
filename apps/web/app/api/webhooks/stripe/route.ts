import { db, eq, organizations } from "@doost/db";
import { headers } from "next/headers";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("STRIPE_WEBHOOK_SECRET not configured", {
      status: 500,
    });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            session.subscription as string,
          );
          const plan = mapPriceIdToPlan(
            subscription.items.data[0]?.price.id ?? "",
          );
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;

          if (customerId) {
            await db
              .update(organizations)
              .set({
                plan,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
                updatedAt: new Date(),
              })
              .where(eq(organizations.stripeCustomerId, customerId));
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const plan = mapPriceIdToPlan(
          subscription.items.data[0]?.price.id ?? "",
        );
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await db
          .update(organizations)
          .set({
            plan,
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date(),
          })
          .where(eq(organizations.stripeCustomerId, customerId));
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await db
          .update(organizations)
          .set({
            plan: "free",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(organizations.stripeCustomerId, customerId));
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        console.error(
          `Payment failed for customer ${customerId}, invoice ${invoice.id}`,
        );
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler failed:", err instanceof Error ? err.message : err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

function mapPriceIdToPlan(
  priceId: string,
): "free" | "starter" | "pro" | "agency" {
  const starterPrice = process.env.STRIPE_PRICE_STARTER;
  const proPrice = process.env.STRIPE_PRICE_PRO;
  const agencyPrice = process.env.STRIPE_PRICE_AGENCY;

  if (priceId === starterPrice) return "starter";
  if (priceId === proPrice) return "pro";
  if (priceId === agencyPrice) return "agency";

  console.warn(
    `Unknown Stripe price ID: ${priceId}. Check STRIPE_PRICE_STARTER/PRO/AGENCY env vars. Defaulting to free.`,
  );
  return "free";
}
