"use client";

import { useClerk, UserButton, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  ChevronDown,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LineChart,
  LogOut,
  Search,
  Settings,
  ShoppingBag,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CreditBalance } from "./credit-balance";
import { OrgSwitcher } from "./org-switcher";

// ── Nav config — matches reference image exactly ─────────────────

const mainNav = [
  { href: "/dashboard", label: "Hem", icon: Home, exact: true },
  { href: "/dashboard/analytics", label: "Analys", icon: LineChart },
  { href: "/dashboard/actions", label: "Åtgärder", icon: Zap },
  { href: "/dashboard/campaigns", label: "Kampanjer", icon: BarChart3 },
  { href: "/dashboard/creatives", label: "Kreativ", icon: ImageIcon },
  { href: "/dashboard/products", label: "Produkter", icon: ShoppingBag },
];

const bottomNav = [
  { href: "/dashboard/integrations", label: "Integrationer", icon: LayoutGrid },
  { href: "/dashboard/wallet", label: "Plånbok", icon: Wallet },
  { href: "/dashboard/settings", label: "Inställningar", icon: Settings },
];

// ── User dropdown ────────────────────────────────────────────────

function UserDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref} className="relative border-t px-3 py-3" style={{ borderColor: "var(--doost-border)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-[var(--doost-bg-secondary)]"
      >
        <UserButton
          appearance={{ elements: { avatarBox: "h-8 w-8" } }}
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-medium text-[var(--doost-text)]">
            {user?.fullName ?? "..."}
          </p>
          <p className="truncate text-[11px] text-[var(--doost-text-muted)]">
            Doost AI
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-[var(--doost-text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-2 right-2 z-50 mb-1 overflow-hidden rounded-lg bg-[var(--doost-bg)] py-1 shadow-lg"
          style={{ border: "1px solid var(--doost-border)" }}
        >
          <a
            role="menuitem"
            href="/dashboard/settings"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <User className="h-3.5 w-3.5" /> Profil
          </a>
          <a
            role="menuitem"
            href="/dashboard/settings"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <Settings className="h-3.5 w-3.5" /> Inställningar
          </a>
          <div className="mx-2 my-1 h-px bg-[var(--doost-border)]" />
          <button
            role="menuitem"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--color-error,#DC2626)] hover:bg-[var(--color-error-light,#FEF2F2)]"
          >
            <LogOut className="h-3.5 w-3.5" /> Logga ut
          </button>
        </div>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  useUser();

  function isExactActive(href: string) {
    return pathname === href;
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isParentOnly(href: string, exact?: boolean) {
    if (exact) return false;
    return !isExactActive(href) && pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="flex h-full flex-col bg-[var(--doost-bg)] border-r"
      style={{ width: "var(--doost-sidebar-w)", borderColor: "var(--doost-border)" }}
    >
      {/* Logo + Search */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center transition-opacity hover:opacity-80" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol.svg" alt="Doost AI" className="h-7 w-7" />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--doost-bg-active)] focus-visible:outline-none"
            aria-label="Sök (⌘K)"
          >
            <Search className="h-4 w-4" />
          </button>
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-medium text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }} title="Sök (⌘K)">
            ⌘K
          </kbd>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)] md:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Org switcher (agency users only) */}
      <OrgSwitcher />

      {/* Main nav */}
      <nav aria-label="Huvudnavigering" className="flex-1 space-y-0.5 px-2">
        {mainNav.map((item) => {
          const active = isActive(item.href, item.exact);
          const parentOnly = isParentOnly(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onClose}
              aria-current={active && !parentOnly ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                active && !parentOnly
                  ? "bg-[var(--doost-bg-active)] text-white"
                  : parentOnly
                    ? "text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
                    : "text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)] hover:text-[var(--doost-text)]",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--doost-border)]" />

      {/* Bottom nav */}
      <nav aria-label="Kontoinställningar" className="space-y-0.5 px-2 py-3">
        {bottomNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                active
                  ? "bg-[var(--doost-bg-active)] text-white"
                  : "text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)] hover:text-[var(--doost-text)]",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <CreditBalance />

      {/* User */}
      <UserDropdown />
    </aside>
  );
}
