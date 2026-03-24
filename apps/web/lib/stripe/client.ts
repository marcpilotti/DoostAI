import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith("sk_test_...")) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Price IDs — set these after creating products in Stripe Dashboard
export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  agency: process.env.STRIPE_PRICE_AGENCY ?? "",
} as const;
