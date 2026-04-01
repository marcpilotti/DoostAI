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
  paused: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[#E65100]", label: "Paused" },
  review: { bg: "bg-[var(--doost-bg-badge-review)]", text: "text-[#E65100]", label: "In review" },
  draft: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-secondary)]", label: "Draft" },
  completed: { bg: "bg-[var(--doost-bg-secondary)]", text: "text-[var(--doost-text-secondary)]", label: "Completed" },
};

const STATUS_FILTER_OPTIONS: { value: Campaign["status"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "review", label: "In review" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "google") return <div className="h-4 w-4 rounded-full bg-[#4285F4]" />;
  if (platform === "linkedin") return <div className="h-4 w-4 rounded-sm bg-[#0A66C2]" />;
  return <div className="h-4 w-4 rounded-full bg-[#0081FB]" />;
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
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-36 overflow-hidden rounded-lg bg-[var(--doost-bg)] py-1 shadow-lg"
          style={{ border: "1px solid var(--doost-border)" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onPause(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[var(--doost-text)] hover:bg-[var(--doost-bg-secondary)]"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  useEffect(() => { document.title = "Campaigns — Doost AI"; }, []);
  const router = useRouter();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<Campaign["status"] | "all">("all");
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const filteredCampaigns = statusFilter === "all"
    ? campaigns
    : campaigns.filter((c) => c.status === statusFilter);

  function handlePause(campaign: Campaign) {
    toast.success("Campaign paused", campaign.name);
  }

  function handleDuplicate(campaign: Campaign) {
    toast.success("Campaign duplicated", campaign.name);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success("Campaign deleted", deleteTarget.name);
    setDeleteTarget(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">Campaigns</h2>
        <Link href="/dashboard/campaigns/builder" className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] font-medium text-white hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> New campaign
        </Link>
      </div>

      {/* Status filter */}
      <div className="mb-4">
        <div className="relative inline-block">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Campaign["status"] | "all")}
            className="appearance-none rounded-lg bg-[var(--doost-bg)] py-2 pl-3 pr-8 text-[12px] font-medium text-[var(--doost-text)] transition-colors hover:bg-[var(--doost-bg-secondary)] focus:outline-none"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--doost-text-muted)]" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: `1px solid var(--doost-border)` }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-left text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }}>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spend</th>
              <th className="px-4 py-3 text-right">ROAS</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((c) => {
              const s = STATUS_STYLES[c.status];
              return (
                <tr key={c.id} className="cursor-pointer border-b last:border-0 transition-colors hover:bg-[var(--doost-bg-secondary)]" style={{ borderColor: "var(--doost-border)" }} onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={c.platform} />
                      <span className="font-medium text-[var(--doost-text)]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">${c.dailyBudget}/d</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">${c.totalSpend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--doost-text)]">{c.roas > 0 ? `${c.roas}x` : "\u2014"}</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">{c.clicks > 0 ? c.clicks.toLocaleString() : "\u2014"}</td>
                  <td className="px-4 py-3 text-right text-[var(--doost-text)]">{c.ctr > 0 ? `${c.ctr}%` : "\u2014"}</td>
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
                  No campaigns match this filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete campaign"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
