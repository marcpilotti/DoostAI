"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

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
    <div className="animate-card-in mt-2 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {children}
    </div>
  );
}

// After profile approval → brief interstitial → complete
export function OnboardingCards({
  data,
  onAllComplete,
}: {
  data: OnboardingData;
  onAllComplete: () => void;
}) {
  const [profileApproved, setProfileApproved] = useState(false);

  useEffect(() => {
    function handleApproved() {
      setProfileApproved(true);
      setTimeout(() => onAllComplete(), 1500);
    }
    window.addEventListener("doost:profile-approved", handleApproved);
    return () => window.removeEventListener("doost:profile-approved", handleApproved);
  }, [onAllComplete]);

  if (profileApproved) {
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

  return null;
}
