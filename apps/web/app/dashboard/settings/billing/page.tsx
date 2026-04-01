"use client";

import { Check, CreditCard, ExternalLink, Sparkles } from "lucide-react";

// TODO: Wire orgId from Clerk user/org when DB is connected
import { Button } from "@/components/ui/button";
import {
  getPlanDisplayName,
  PLAN_PRICES,
} from "@/lib/stripe/plan-limits";

const PLANS = ["free", "starter", "pro", "agency"] as const;
type Plan = (typeof PLANS)[number];

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ["1 kampanj", "1 kanal", "Vattenstämpel på annonser"],
  starter: ["5 kampanjer", "2 kanaler", "Mall-baserade annonser", "E-postsupport"],
  pro: [
    "Obegränsade kampanjer",
    "3 kanaler",
    "AI-genererade bilder",
    "A/B-testning",
    "Prioriterad support",
  ],
  agency: [
    "Allt i Pro",
    "White-label",
    "20 kundkonton",
    "API-åtkomst",
    "Dedikerad kontaktperson",
  ],
};

function PlanCard({
  plan,
  currentPlan,
}: {
  plan: Plan;
  currentPlan: Plan;
}) {
  const isCurrent = plan === currentPlan;
  const price = PLAN_PRICES[plan];
  const features = PLAN_FEATURES[plan];
  const isPopular = plan === "pro";

  async function handleUpgrade() {
    if (plan === "free" || isCurrent) return;

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, orgId: "pending" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        isPopular
          ? "border-indigo-200 bg-indigo-50/30 shadow-md"
          : "border-border/60 bg-white/60"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            <Sparkles className="h-3 w-3" />
            Populärast
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-heading text-lg font-semibold">
          {getPlanDisplayName(plan)}
        </h3>
        <div className="mt-2">
          <span className="text-3xl font-bold">
            {price.monthly === 0 ? "Gratis" : `€${price.monthly}`}
          </span>
          {price.monthly > 0 && (
            <span className="text-sm text-muted-foreground">/mån</span>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={handleUpgrade}
        variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
        className={isPopular && !isCurrent ? "bg-indigo-500 hover:bg-indigo-600" : ""}
        disabled={isCurrent}
      >
        {isCurrent ? "Nuvarande plan" : plan === "free" ? "Gratis" : "Uppgradera"}
      </Button>
    </div>
  );
}

export default function BillingPage() {
  const currentPlan: Plan = "free";

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: "demo-org" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Fakturering</h1>
        <p className="mt-1 text-muted-foreground">
          Hantera din prenumeration och betalningsmetod.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan} plan={plan} currentPlan={currentPlan} />
        ))}
      </div>

      {/* Billing management */}
      <div className="mt-10 rounded-2xl border border-border/60 bg-white/60 p-6">
        <h2 className="font-heading text-lg font-semibold">
          Betalningshantering
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uppdatera betalningsmetod, se fakturor och hantera din prenumeration.
        </p>
        <Button
          onClick={handlePortal}
          variant="outline"
          className="mt-4"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Öppna kundportal
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
