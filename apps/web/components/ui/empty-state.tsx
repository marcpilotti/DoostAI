"use client";
import Link from "next/link";

export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--doost-bg-secondary)]">
        <Icon className="h-5 w-5 text-[var(--doost-text-muted)]" />
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--doost-text)]">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-[13px] text-[var(--doost-text-muted)]">{description}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="mt-4 rounded-lg bg-[var(--doost-bg-active)] px-4 py-2 text-[12px] font-medium text-white hover:opacity-90">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
