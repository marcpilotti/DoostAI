/**
 * Dashboard Home — Phase 2 will add KPIs, chart, activity feed.
 * For now, confirms the layout shell works.
 */
export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">
          Dashboard home — Phase 2 content
        </div>
      </div>

      {/* Placeholder KPI row */}
      <div className="grid grid-cols-5 gap-4">
        {["Clicks", "Views", "ROAS", "Ad Spend", "Revenue"].map((label) => (
          <div
            key={label}
            className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4"
            style={{ border: `1px solid var(--doost-border)` }}
          >
            <div className="text-[12px] text-[var(--doost-text-muted)]">{label}</div>
            <div className="mt-1 text-2xl font-bold text-[var(--doost-text)]">—</div>
          </div>
        ))}
      </div>

      {/* Placeholder chart area */}
      <div
        className="mt-6 flex h-[300px] items-center justify-center rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]"
        style={{ border: `1px solid var(--doost-border)` }}
      >
        <p className="text-[13px] text-[var(--doost-text-muted)]">Chart — Phase 2</p>
      </div>

      {/* Placeholder activity */}
      <div className="mt-6">
        <h2 className="mb-4 text-[18px] font-semibold text-[var(--doost-text)]">Campaign Activity</h2>
        <div
          className="flex h-[200px] items-center justify-center rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)]"
          style={{ border: `1px solid var(--doost-border)` }}
        >
          <p className="text-[13px] text-[var(--doost-text-muted)]">Activity feed — Phase 2</p>
        </div>
      </div>
    </div>
  );
}
