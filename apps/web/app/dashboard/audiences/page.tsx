"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { MOCK_AUDIENCES } from "@/lib/mock-data";
import type { Audience } from "@/lib/mock-data";

type SortField = "name" | "platform" | "type" | "sizeEstimate" | "linkedCampaigns";
type SortDir = "asc" | "desc";

function SortIndicator({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) {
    return <ChevronDown className="ml-0.5 inline h-3 w-3 opacity-0 group-hover:opacity-40" />;
  }
  return sortDir === "asc"
    ? <ChevronUp className="ml-0.5 inline h-3 w-3" />
    : <ChevronDown className="ml-0.5 inline h-3 w-3" />;
}

export default function AudiencesPage() {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...MOCK_AUDIENCES].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return dir * aVal.localeCompare(bVal);
    }
    return dir * ((aVal as number) - (bVal as number));
  });

  return (
    <div className="p-6">
      <h2 className="mb-6 text-[18px] font-semibold text-[var(--doost-text)]">Audiences</h2>

      <div className="overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: `1px solid var(--doost-border)` }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-left text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }}>
              <th className="group cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("name")}>
                Audience <SortIndicator field="name" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="group cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("platform")}>
                Platform <SortIndicator field="platform" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="group cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("type")}>
                Type <SortIndicator field="type" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="group cursor-pointer select-none px-4 py-3 text-right" onClick={() => toggleSort("sizeEstimate")}>
                Est. size <SortIndicator field="sizeEstimate" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="group cursor-pointer select-none px-4 py-3 text-right" onClick={() => toggleSort("linkedCampaigns")}>
                Campaigns <SortIndicator field="linkedCampaigns" sortField={sortField} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.id} className="border-b last:border-0 transition-colors hover:bg-[var(--doost-bg-secondary)]" style={{ borderColor: "var(--doost-border)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--doost-text-muted)]" />
                    <span className="font-medium text-[var(--doost-text)]">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-[var(--doost-text-secondary)]">{a.platform}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--doost-bg-secondary)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--doost-text-secondary)]">{a.type}</span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--doost-text)]">{a.sizeEstimate.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-[var(--doost-text)]">{a.linkedCampaigns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
