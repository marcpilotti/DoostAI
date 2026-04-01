"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Plus } from "lucide-react";

/**
 * Organization switcher for agency users.
 * Uses Clerk Organizations when available, falls back to single-org mode.
 *
 * Note: Requires Clerk Organizations to be enabled in the Clerk dashboard.
 * Import useOrganizationList from @clerk/nextjs when ready.
 */
export function OrgSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // For now, show a placeholder that can be wired to Clerk Organizations
  // when the feature is enabled in the Clerk dashboard
  const [orgs] = useState<Array<{ id: string; name: string }>>([]);
  const currentOrg = "Doost AI";

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Don't render if only one org (most users)
  if (orgs.length <= 1) return null;

  return (
    <div ref={ref} className="relative mx-2 mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] transition-colors hover:bg-[var(--doost-bg-secondary)]"
      >
        <Building2 className="h-3.5 w-3.5" />
        <span className="flex-1 truncate text-left">{currentOrg}</span>
        <ChevronDown className={`h-3 w-3 text-[var(--doost-text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg bg-[var(--doost-bg)] py-1 shadow-lg"
          style={{ border: "1px solid var(--doost-border)" }}
        >
          {orgs.map((org) => (
            <button
              key={org.id}
              role="option"
              aria-selected={org.name === currentOrg}
              onClick={() => {
                // When Clerk Organizations is enabled:
                // setActive({ organization: org.id });
                // queryClient.clear();
                router.push("/dashboard");
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-[var(--doost-bg-secondary)] ${
                org.name === currentOrg ? "font-semibold text-[var(--doost-text)]" : "text-[var(--doost-text-secondary)]"
              }`}
            >
              <Building2 className="h-3 w-3" />
              {org.name}
            </button>
          ))}
          <div className="mx-2 my-1 h-px bg-[var(--doost-border)]" />
          <button
            onClick={() => { setOpen(false); router.push("/dashboard/settings"); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <Plus className="h-3 w-3" />
            Lägg till kund
          </button>
        </div>
      )}
    </div>
  );
}
