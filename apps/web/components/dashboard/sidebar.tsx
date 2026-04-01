"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  ChevronDown,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LineChart,
  Package,
  Search,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CreditBalance } from "./credit-balance";

// ── Nav config — matches reference image exactly ─────────────────

const mainNav = [
  { href: "/dashboard", label: "Hem", icon: Home, exact: true },
  { href: "/dashboard/analytics", label: "Analys", icon: LineChart },
  { href: "/dashboard/actions", label: "Åtgärder", icon: Zap },
  { href: "/dashboard/campaigns", label: "Kampanjer", icon: BarChart3 },
  { href: "/dashboard/campaigns/builder", label: "Byggare", icon: Zap },
  { href: "/dashboard/creatives", label: "Kreativ", icon: ImageIcon },
  { href: "/dashboard/products", label: "Produkter", icon: ShoppingBag },
];

const bottomNav = [
  { href: "/dashboard/integrations", label: "Integrationer", icon: LayoutGrid },
  { href: "/dashboard/wallet", label: "Plånbok", icon: Wallet },
  { href: "/dashboard/settings", label: "Inställningar", icon: Settings },
];

// ── Component ────────────────────────────────────────────────────

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="flex h-full flex-col bg-[var(--doost-bg)] border-r"
      style={{ width: "var(--doost-sidebar-w)", borderColor: "var(--doost-border)" }}
    >
      {/* Logo + Search */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol.svg" alt="Doost AI" className="h-7 w-7" />
        </Link>
        <div className="flex items-center gap-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]">
            <Search className="h-4 w-4" />
          </button>
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-medium text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }}>
            ⌘K
          </kbd>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)] md:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-2">
        {mainNav.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--doost-border)]" />

      {/* Bottom nav */}
      <nav className="space-y-0.5 px-2 py-3">
        {bottomNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
      <div className="border-t px-3 py-3" style={{ borderColor: "var(--doost-border)" }}>
        <div className="flex items-center gap-2.5">
          <UserButton
            appearance={{ elements: { avatarBox: "h-8 w-8" } }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--doost-text)]">
              {user?.fullName ?? "..."}
            </p>
            <p className="truncate text-[11px] text-[var(--doost-text-muted)]">
              Doost AI
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        </div>
      </div>
    </aside>
  );
}
