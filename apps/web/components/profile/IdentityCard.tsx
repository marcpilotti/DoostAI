"use client";

import { Building2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export type IdentityData = {
  name: string;
  url: string;
  industry?: string;
  employees?: number;
  revenue?: string;
  ceo?: string;
  orgNumber?: string;
  colors: string[];
  fonts: string[];
  logoUrl?: string;
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
};

export function IdentityCard({ data }: { data: IdentityData }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? {} : fadeIn;

  return (
    <motion.div
      {...variants}
      className="rounded-xl bg-[var(--doost-bg)] p-4"
      style={{ border: "1px solid var(--doost-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="h-4 w-4 text-[var(--doost-text-muted)]" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">
          Identitet
        </span>
      </div>
      <div className="flex items-start gap-3">
        {data.logoUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={data.logoUrl}
            alt={`${data.name} logo`}
            className="h-10 w-10 rounded-lg object-contain"
            style={{ border: "1px solid var(--doost-border)" }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-[var(--doost-text)]">{data.name}</h3>
          <p className="text-[12px] text-[var(--doost-text-muted)]">{data.url}</p>
          {data.industry && (
            <p className="mt-1 text-[12px] text-[var(--doost-text-secondary)]">
              {data.industry}
              {data.employees ? ` · ${data.employees} anställda` : ""}
              {data.revenue ? ` · ${data.revenue}` : ""}
            </p>
          )}
          {data.orgNumber && (
            <p className="text-[11px] text-[var(--doost-text-muted)]">
              Org.nr: {data.orgNumber}
              {data.ceo ? ` · VD: ${data.ceo}` : ""}
            </p>
          )}
        </div>
      </div>
      {data.colors.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {data.colors.slice(0, 5).map((c, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-md"
              style={{ backgroundColor: c, border: "1px solid var(--doost-border)" }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
