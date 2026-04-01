"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Hem",
  campaigns: "Kampanjer",
  builder: "Byggare",
  creatives: "Kreativ",
  analytics: "Analys",
  settings: "Inställningar",
  billing: "Fakturering",
  integrations: "Integrationer",
  wallet: "Plånbok",
  products: "Produkter",
  actions: "Åtgärder",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);
  // Only show breadcrumbs when deeper than /dashboard
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = LABEL_MAP[seg] ?? seg;
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Brödsmulor" className="flex items-center gap-1 px-6 pt-4 pb-1">
      {crumbs.map((crumb, i) => (
        <div key={crumb.href} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 text-[var(--doost-text-muted)]" />
          )}
          {crumb.isLast ? (
            <span className="text-[12px] font-medium text-[var(--doost-text)]" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-[12px] font-medium text-[var(--doost-text-muted)] transition-colors hover:text-[var(--doost-text)]"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
