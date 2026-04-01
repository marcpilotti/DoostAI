"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, MoreHorizontal, Pause, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import type { Campaign } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const STATUS_STYLES: Record<Campaign["status"], { bg: string; text: string; label: string }> = {
  live: { bg: "bg-[var(--doost-bg-badge-ready)]", text: "text-[var(--doost-text-positive)]", label: "Live" },
  paused: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[var(--color-warning,#E65100)]", label: "Pausad" },
  review: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[var(--color-warning,#E65100)]", label: "Granskas" },
  draft: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-secondary)]", label: "Utkast" },
  completed: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-secondary)]", label: "Avslutad" },
};

const STATUS_FILTER_OPTIONS: { value: Campaign["status"] | "all"; label: string }[] = [
  { value: "all", label: "Alla" },
  { value: "live", label: "Live" },
  { value: "paused", label: "Pausad" },
  { value: "review", label: "Granskas" },
  { value: "draft", label: "Utkast" },
  { value: "completed", label: "Avslutad" },
];

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "google") return <div className="h-4 w-4 rounded-full bg-[var(--brand-google)]" />;
  if (platform === "linkedin") return <div className="h-4 w-4 rounded-sm bg-[var(--brand-linkedin)]" />;
  return <div className="h-4 w-4 rounded-full bg-[var(--brand-meta)]" />;
}

function ActionDropdown({ campaign, onPause, onDuplicate, onDelete }: { campaign: Campaign; onPause: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((prev) => !prev); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Kampanjåtgärder"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-50 w-36 overflow-hidden rounded-lg bg-[var(--doost-bg)] py-1 shadow-lg"
          style={{ border: "1px solid var(--doost-border)" }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onPause(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <Pause className="h-3.5 w-3.5" /> Pausa
          </button>
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicera
          </button>
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--color-error,#DC2626)] hover:bg-[var(--color-error-light,#FEF2F2)]"
          >
            <Trash2 className="h-3.5 w-3.5" /> Ta bort
          </button>
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  useEffect(() => { document.title = "Kampanjer — Doost AI"; }, []);
  const router = useRouter();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<Campaign["status"] | "all">("all");
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const filteredCampaigns = statusFilter === "all"
    ? campaigns
    : campaigns.filter((c) => c.status === statusFilter);

  const statusCounts = campaigns.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  function handlePause(campaign: Campaign) {
    setCampaigns((prev) => prev.map((c) =>
      c.id === campaign.id ? { ...c, status: c.status === "paused" ? "live" as const : "paused" as const } : c
    ));
    toast.success(
      campaign.status === "paused" ? "Kampanj återupptagen" : "Kampanj pausad",
      campaign.name,
    );
  }

  function handleDuplicate(campaign: Campaign) {
    const dup = { ...campaign, id: `${campaign.id}-dup-${Date.now()}`, name: `${campaign.name} (kopia)`, status: "draft" as const };
    setCampaigns((prev) => [...prev, dup]);
    toast.success("Kampanj duplicerad", dup.name);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    setCampaigns((prev) => prev.filter((c) => c.id !== removed.id));
    toast.toast({
      type: "success",
      title: "Kampanj borttagen",
      description: removed.name,
      duration: 6000,
      action: {
        label: "Ångra",
        onClick: () => setCampaigns((prev) => [...prev, removed]),
      },
    });
    setDeleteTarget(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg sm:text-[22px] font-semibold text-[var(--doost-text)]">Kampanjer</h1>
        <Link href="/dashboard/campaigns/builder" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Ny kampanj
        </Link>
      </div>

      {/* Status filter */}
      <div className="mb-4 pb-4 border-b" style={{ borderColor: "var(--doost-border)" }}>
        <div className="relative inline-block">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Campaign["status"] | "all")}
            className="appearance-none rounded-lg bg-[var(--doost-bg)] py-2 pl-3 pr-8 text-[12px] font-medium text-[var(--doost-text)] transition-colors hover:bg-[var(--doost-bg-secondary)] focus:outline-none"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const count = opt.value === "all" ? campaigns.length : (statusCounts[opt.value] ?? 0);
              return (
                <option key={opt.value} value={opt.value}>{opt.label} ({count})</option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--doost-text-muted)]" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: `1px solid var(--doost-border)` }}>
        <table className="w-full text-[13px]">
          <caption className="sr-only">Kampanjöversikt med status, budget och resultat</caption>
          <thead>
            <tr className="border-b text-left text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }}>
              <th className="px-4 py-3">Kampanj</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spenderat</th>
              <th className="px-4 py-3 text-right">ROAS</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">Klick</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">CTR</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((c) => {
              const s = STATUS_STYLES[c.status];
              return (
                <tr key={c.id} tabIndex={0} className="cursor-pointer border-b last:border-0 transition-colors hover:bg-[var(--doost-bg-secondary)] hover:shadow-[inset_3px_0_0_var(--doost-bg-active)] focus-visible:bg-[var(--doost-bg-secondary)] focus-visible:shadow-[inset_3px_0_0_var(--doost-bg-active)] focus-visible:outline-none" style={{ borderColor: "var(--doost-border)" }} onClick={() => router.push(`/dashboard/campaigns/${c.id}`)} onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/campaigns/${c.id}`); }} onMouseEnter={() => router.prefetch(`/dashboard/campaigns/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={c.platform} />
                      <span className="font-medium text-[var(--doost-text)] truncate max-w-[200px] sm:max-w-[300px]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">${c.dailyBudget}/d</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">${c.totalSpend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--doost-text)]">{c.roas > 0 ? `${c.roas}x` : "\u2014"}</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)] hidden md:table-cell">{c.clicks > 0 ? c.clicks.toLocaleString() : "\u2014"}</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)] hidden md:table-cell">{c.ctr > 0 ? `${c.ctr}%` : "\u2014"}</td>
                  <td className="px-4 py-3">
                    <ActionDropdown
                      campaign={c}
                      onPause={() => handlePause(c)}
                      onDuplicate={() => handleDuplicate(c)}
                      onDelete={() => setDeleteTarget(c)}
                    />
                  </td>
                </tr>
              );
            })}
            {filteredCampaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-[var(--doost-text-muted)]">
                  Inga kampanjer matchar detta filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Ta bort kampanj"
        description={`Är du säker på att du vill ta bort "${deleteTarget?.name ?? ""}"? Denna åtgärd kan inte ångras.`}
        confirmLabel="Ta bort"
        cancelLabel="Avbryt"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
