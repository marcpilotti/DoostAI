"use client";

/**
 * PageShell — standard wrapper for dashboard pages.
 * Provides consistent padding, max-width, and optional header.
 */
export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6">
      {(title || actions) && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[13px] text-[var(--doost-text-muted)]">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
