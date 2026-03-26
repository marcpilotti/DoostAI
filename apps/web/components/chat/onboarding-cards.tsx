"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Plug, Mail, Lock, Eye, EyeOff } from "lucide-react";

type OnboardingStep = "connectors" | "signup" | "done";

type LogoData = {
  primary?: string;
  icon?: string;
  dark?: string;
};

type OnboardingData = {
  hasLogo: boolean;
  companyName: string;
  logos: LogoData;
};

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-card-in mt-3 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {children}
    </div>
  );
}

// ── Step 2: Connect ad platforms ────────────────────────────────
function ConnectorStep({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <StepCard>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
            <Plug className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Har du redan annonskonton?</div>
            <div className="text-[11px] text-muted-foreground">
              Koppla dina befintliga konton — eller skippa så skapar vi allt åt dig
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-white px-4 py-3 transition-all hover:border-[#1877F2]/30 hover:bg-blue-50/30 hover:shadow-sm">
            <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Meta Business</div>
              <div className="text-[10px] text-muted-foreground">Facebook & Instagram</div>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">Koppla konto</span>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-white px-4 py-3 transition-all hover:border-[#4285F4]/30 hover:bg-blue-50/30 hover:shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.5 6.5 0 0 1 0-4.2V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Google Ads</div>
              <div className="text-[10px] text-muted-foreground">Sök & Display</div>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">Koppla konto</span>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-white px-4 py-3 transition-all hover:border-[#0077B5]/30 hover:bg-blue-50/30 hover:shadow-sm">
            <svg className="h-5 w-5 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">LinkedIn</div>
              <div className="text-[10px] text-muted-foreground">B2B-annonsering</div>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">Koppla konto</span>
          </button>
        </div>

        {/* "Vi löser det" info */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50/50 px-3 py-2.5">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Har du inga konton? <span className="font-medium text-foreground">Inga problem — vi skapar och hanterar allt åt dig.</span> Du behöver aldrig logga in på Meta eller Google själv.
          </p>
        </div>
      </div>

      {/* Footer with prominent skip */}
      <div className="flex items-center justify-between border-t border-border/20 px-5 py-3">
        <span className="text-[10px] text-muted-foreground/40">Valfritt steg</span>
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
        >
          Hoppa över
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </StepCard>
  );
}

// ── Step 3: Create account ──────────────────────────────────────
function SignupStep({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSaving(true);
    // TODO: wire to Clerk signup API
    setTimeout(() => {
      setSaving(false);
      window.dispatchEvent(new CustomEvent("doost:signup-complete"));
      onComplete();
    }, 1200);
  }

  return (
    <StepCard>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
            <Lock className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Sista steget innan din första annons</div>
            <div className="text-[11px] text-muted-foreground">
              Spara allt du byggt — kampanjhistorik, analyser och mer
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              E-post
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-white px-3 py-2.5 transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200">
              <Mail className="h-4 w-4 text-muted-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Lösenord
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-white px-3 py-2.5 transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200">
              <Lock className="h-4 w-4 text-muted-foreground/40" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground/40 hover:text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password || password.length < 8 || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md disabled:opacity-40"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sparar...
              </>
            ) : (
              <>
                Skapa konto
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="border-t border-border/20 px-5 py-2.5 text-center text-[10px] text-muted-foreground/40">
        Genom att skapa konto godkänner du våra villkor
      </div>
    </StepCard>
  );
}

// ── Main Component ──────────────────────────────────────────────
export function OnboardingCards({
  data,
  onAllComplete,
}: {
  data: OnboardingData;
  onAllComplete: () => void;
}) {
  const [profileApproved, setProfileApproved] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("connectors");

  // Wait for profile card "Godkänn alla & fortsätt" before showing
  useEffect(() => {
    function handleApproved() {
      setProfileApproved(true);
    }
    window.addEventListener("doost:profile-approved", handleApproved);
    return () => window.removeEventListener("doost:profile-approved", handleApproved);
  }, []);

  function advance(from: OnboardingStep) {
    if (from === "connectors") {
      setCurrentStep("signup");
    } else if (from === "signup") {
      setCurrentStep("done");
      onAllComplete();
    }
  }

  // Don't render until profile card is approved
  if (!profileApproved) return null;

  return (
    <div className="space-y-0">
      {currentStep === "connectors" && (
        <ConnectorStep onComplete={() => advance("connectors")} />
      )}
      {currentStep === "signup" && (
        <SignupStep onComplete={() => advance("signup")} />
      )}
    </div>
  );
}
