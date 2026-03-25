"use client";

import { useState } from "react";
import { ArrowRight, Check, Image, Type, Plug, Upload } from "lucide-react";

type OnboardingStep = "logo" | "font" | "connectors" | "done";

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
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      {children}
    </div>
  );
}

function emitLogoSelected(url: string) {
  window.dispatchEvent(
    new CustomEvent("doost:logo-selected", { detail: { url } }),
  );
}

// ── Logo Step ───────────────────────────────────────────────────
function LogoStep({
  companyName,
  logos,
  onComplete,
}: {
  companyName: string;
  logos: LogoData;
  onComplete: (skipped: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState<string | null>(null);

  const foundLogos: { url: string; label: string }[] = [];
  if (logos.primary) foundLogos.push({ url: logos.primary, label: "Primär" });
  if (logos.dark) foundLogos.push({ url: logos.dark, label: "Alternativ" });
  if (logos.icon && logos.icon !== logos.primary)
    foundLogos.push({ url: logos.icon, label: "Ikon" });

  const hasFoundLogos = foundLogos.length > 0;
  const hasSelection = selected !== null || customUrl !== null;

  function handleSelect(url: string) {
    setSelected(url);
    setCustomUrl(null);
    emitLogoSelected(url);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomUrl(url);
    setSelected(null);
    emitLogoSelected(url);
  }

  function handleContinue() {
    onComplete(false);
  }

  function handleSkip() {
    onComplete(true);
  }

  return (
    <StepCard>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Image className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Logotyp</div>
            <div className="text-[11px] text-muted-foreground">
              {hasFoundLogos
                ? "Vi hittade dessa loggor — välj en eller ladda upp din egen"
                : "Vi hittade ingen logga — ladda upp en eller gå vidare"}
            </div>
          </div>
        </div>

        {/* Scraped logos */}
        {hasFoundLogos && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {foundLogos.map((logo) => (
              <button
                key={logo.url}
                onClick={() => handleSelect(logo.url)}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                  selected === logo.url
                    ? "border-indigo-400 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-200"
                    : "border-border/50 bg-white hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                {selected === logo.url && (
                  <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
                <div
                  className="flex h-16 w-full items-center justify-center rounded-lg p-2"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                    backgroundSize: "10px 10px",
                    backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.url}
                    alt={`${companyName} ${logo.label}`}
                    className="max-h-14 max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {logo.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Upload own logo */}
        {!customUrl ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30">
            <Upload className="h-5 w-5 text-muted-foreground/40" />
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {hasFoundLogos
                  ? "Eller ladda upp en egen logga istället"
                  : "Klicka för att ladda upp logga"}
              </span>
              <span className="block text-[10px] text-muted-foreground/50">
                PNG, SVG eller JPG (max 2MB)
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-sm text-emerald-700">Egen logga uppladdad!</span>
            <label className="ml-auto cursor-pointer text-[10px] font-medium text-emerald-600 underline hover:text-emerald-800">
              Byt
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/50">Steg 1 av 3</span>
          <button
            onClick={handleSkip}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
          Hoppa över
        </button>
        </div>
        <button
          onClick={handleContinue}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
        >
          {hasSelection ? "Ser bra ut" : "Fortsätt utan logga"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </StepCard>
  );
}

// ── Font Step ───────────────────────────────────────────────────
function FontStep({
  onComplete,
}: {
  onComplete: (skipped: boolean) => void;
}) {
  const [uploaded, setUploaded] = useState(false);

  return (
    <StepCard>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
            <Type className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Typsnitt</div>
            <div className="text-[11px] text-muted-foreground">
              Vill du använda ett specifikt typsnitt?
            </div>
          </div>
        </div>

        {!uploaded ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-6 transition-colors hover:border-purple-300 hover:bg-purple-50/30">
            <Type className="h-6 w-6 text-muted-foreground/40" />
            <span className="text-sm font-medium text-muted-foreground">
              Ladda upp .ttf eller .otf
            </span>
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setUploaded(true);
                  setTimeout(() => onComplete(false), 500);
                }
              }}
            />
          </label>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-700">Font uppladdad!</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
        <span className="text-[10px] text-muted-foreground/50">Steg 2 av 3</span>
        <button
          onClick={() => onComplete(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
        >
          {uploaded ? "Fortsätt" : "Hoppa över"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </StepCard>
  );
}

// ── Connector Step ──────────────────────────────────────────────
function ConnectorStep({
  onComplete,
}: {
  onComplete: (skipped: boolean) => void;
}) {
  return (
    <StepCard>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Plug className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Anslut annonsplattformar</div>
            <div className="text-[11px] text-muted-foreground">
              Du kan koppla senare — det går att förhandsvisa utan konto
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 transition-colors hover:border-[#1877F2]/30 hover:bg-blue-50/30">
            <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Meta Business</div>
              <div className="text-[10px] text-muted-foreground">Facebook & Instagram</div>
            </div>
            <span className="text-xs text-muted-foreground">Anslut →</span>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 transition-colors hover:border-[#4285F4]/30 hover:bg-blue-50/30">
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
            <span className="text-xs text-muted-foreground">Anslut →</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
        <span className="text-[10px] text-muted-foreground/50">Steg 3 av 3</span>
        <button
          onClick={() => onComplete(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
        >
          Fortsätt
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
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
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("logo");

  function advance(from: OnboardingStep) {
    if (from === "logo") {
      setCurrentStep("font");
    } else if (from === "font") {
      setCurrentStep("connectors");
    } else if (from === "connectors") {
      setCurrentStep("done");
      onAllComplete();
    }
  }

  return (
    <div className="space-y-0">
      {currentStep === "logo" && (
        <LogoStep
          companyName={data.companyName}
          logos={data.logos ?? {}}
          onComplete={() => advance("logo")}
        />
      )}
      {currentStep === "font" && (
        <FontStep onComplete={() => advance("font")} />
      )}
      {currentStep === "connectors" && (
        <ConnectorStep onComplete={() => advance("connectors")} />
      )}
    </div>
  );
}
