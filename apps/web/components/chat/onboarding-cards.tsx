"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";
import { ArrowRight, Check, Plug, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

type OnboardingStep = "connectors" | "signup" | "verify" | "done";

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

// ── Step 2: Connect ad platforms (inverted: "we handle it" is primary) ──
function ConnectorStep({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [showConnectors, setShowConnectors] = useState(false);

  return (
    <StepCard>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
            <Plug className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Annonsplattformar</div>
            <div className="text-[11px] text-muted-foreground">
              Vi skapar och hanterar alla annonskonton åt dig
            </div>
          </div>
        </div>

        {/* Primary: we handle everything */}
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/60 px-4 py-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <div>
            <div className="text-sm font-semibold text-foreground">Vi skapar och hanterar alla konton åt dig</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Du behöver aldrig logga in på Meta, Google eller LinkedIn själv. Vi sköter allt i bakgrunden.
            </p>
          </div>
        </div>

        {/* Secondary: connect existing (expandable) */}
        {!showConnectors ? (
          <button
            onClick={() => setShowConnectors(true)}
            className="mt-2 text-[11px] font-medium text-indigo-500 transition-colors hover:text-indigo-700"
          >
            Jag har redan annonskonton — koppla dem →
          </button>
        ) : (
          <div className="mt-3 space-y-2 animate-message-in">
            <button className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-white px-4 py-2.5 transition-all hover:border-[#1877F2]/30 hover:bg-blue-50/30 hover:shadow-sm">
              <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" /></svg>
              <span className="flex-1 text-left text-xs font-medium">Meta Business</span>
              <span className="text-[10px] font-medium text-indigo-500">Koppla</span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-white px-4 py-2.5 transition-all hover:border-[#4285F4]/30 hover:bg-blue-50/30 hover:shadow-sm">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.1a6.5 6.5 0 0 1 0-4.2V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
              <span className="flex-1 text-left text-xs font-medium">Google Ads</span>
              <span className="text-[10px] font-medium text-indigo-500">Koppla</span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-white px-4 py-2.5 transition-all hover:border-[#0077B5]/30 hover:bg-blue-50/30 hover:shadow-sm">
              <svg className="h-4 w-4 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              <span className="flex-1 text-left text-xs font-medium">LinkedIn</span>
              <span className="text-[10px] font-medium text-indigo-500">Koppla</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/20 px-5 py-3">
        <span className="text-[10px] text-muted-foreground/40">Du kan koppla konton senare i inställningar</span>
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
        >
          Fortsätt utan att koppla
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </StepCard>
  );
}

// ── Step 3: Create account ──────────────────────────────────────
function SignupStep({
  onComplete,
  companyName,
  logoUrl,
}: {
  onComplete: (email: string) => void;
  companyName?: string;
  logoUrl?: string;
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
      onComplete(email);
    }, 1200);
  }

  return (
    <StepCard>
      {/* Header with company identity */}
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg border border-border/20 bg-white object-contain p-1" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Lock className="h-4 w-4 text-white" />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold">
            {companyName ? `Spara ${companyName}s profil` : "Spara ditt konto"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Kampanjhistorik, analyser och allt du byggt
          </div>
        </div>
      </div>

      <div className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              E-post
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
              <Mail className="h-4 w-4 text-indigo-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Lösenord
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
              <Lock className="h-4 w-4 text-indigo-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/40"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground/30 transition-colors hover:text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password || password.length < 8 || saving}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg disabled:opacity-40"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Skapar ditt konto...
              </>
            ) : (
              <>
                Skapa konto
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Trust signals */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40">
          <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Krypterad</span>
          <span>·</span>
          <span>Ingen betalkort krävs</span>
          <span>·</span>
          <span>Avsluta när som helst</span>
        </div>
      </div>

      <div className="border-t border-border/10 bg-muted/5 px-5 py-2 text-center text-[9px] text-muted-foreground/30">
        Genom att skapa konto godkänner du våra <span className="underline">villkor</span>
      </div>
    </StepCard>
  );
}

// ── Step 4: Verify email ─────────────────────────────────────────
function VerifyEmailStep({
  email,
  onComplete,
}: {
  email: string;
  onComplete: () => void;
}) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 3) inputRefs[index + 1]?.current?.focus();
    if (next.every((d) => d) && next.join("").length === 4) {
      setVerifying(true);
      setTimeout(() => { setVerifying(false); onComplete(); }, 800);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  }

  return (
    <StepCard>
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold">Verifiera din e-post</div>
          <div className="text-[11px] text-muted-foreground">
            Vi skickade en kod till {email}
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="flex justify-center gap-3">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-14 w-12 rounded-xl border-2 bg-white text-center text-xl font-bold outline-none transition-all ${
                digit
                  ? "border-indigo-400 text-indigo-600 shadow-sm"
                  : "border-border/50 text-foreground focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              }`}
            />
          ))}
        </div>

        {verifying && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-500">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
            Verifierar...
          </div>
        )}

        <div className="mt-4 text-center">
          <button className="text-[11px] font-medium text-indigo-500 transition-colors hover:text-indigo-700">
            Fick ingen kod? Skicka igen
          </button>
        </div>
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
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("connectors");
  const [userEmail, setUserEmail] = useState("");

  // Wait for profile card "Godkänn alla & fortsätt" before showing
  useEffect(() => {
    function handleApproved() {
      setShowInterstitial(true);
      setTimeout(() => {
        setShowInterstitial(false);
        setProfileApproved(true);
      }, 1500);
    }
    window.addEventListener("doost:profile-approved", handleApproved);
    return () => window.removeEventListener("doost:profile-approved", handleApproved);
  }, []);

  function advance(from: OnboardingStep, email?: string) {
    if (from === "connectors") {
      setCurrentStep("signup");
    } else if (from === "signup") {
      if (email) setUserEmail(email);
      setCurrentStep("verify");
    } else if (from === "verify") {
      setCurrentStep("done");
      onAllComplete();
    }
  }

  // Interstitial: "Profil sparad" confirmation
  if (showInterstitial) {
    return (
      <StepCard>
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-emerald-700">Profil sparad</div>
            <div className="text-[11px] text-muted-foreground">Förbereder dina annonsmallar...</div>
          </div>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-muted/30">
            <div className="h-full animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_100%]" />
          </div>
        </div>
      </StepCard>
    );
  }

  // Don't render until profile card is approved
  if (!profileApproved) return null;

  const logoUrl = data.logos?.primary ?? data.logos?.icon;

  return (
    <div className="space-y-0">
      {currentStep === "connectors" && (
        <ConnectorStep onComplete={() => advance("connectors")} />
      )}
      {currentStep === "signup" && (
        <SignupStep
          onComplete={(email) => advance("signup", email)}
          companyName={data.companyName?.replace(/\s+(AB|HB|Inc|Ltd)$/i, "")}
          logoUrl={logoUrl}
        />
      )}
      {currentStep === "verify" && (
        <VerifyEmailStep
          email={userEmail}
          onComplete={() => advance("verify")}
        />
      )}
    </div>
  );
}
