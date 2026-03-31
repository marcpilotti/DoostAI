"use client";

import { Users } from "lucide-react";
import { MOCK_AUDIENCES } from "@/lib/mock-data";

export default function AudiencesPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-[18px] font-semibold text-[var(--doost-text)]">Audiences</h2>

      <div className="overflow-hidden rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]" style={{ border: `1px solid var(--doost-border)` }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-left text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]" style={{ borderColor: "var(--doost-border)" }}>
              <th className="px-4 py-3">Audience</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Est. size</th>
              <th className="px-4 py-3 text-right">Campaigns</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AUDIENCES.map((a) => (
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
