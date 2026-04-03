"use client";

import type { Platform } from "@/lib/stores/wizard-store";

type PlatformMockupProps = {
  platform: Platform;
  brandName: string;
  logoUrl?: string;
  children: React.ReactNode;
};

function MetaMockup({ brandName, logoUrl, children }: Omit<PlatformMockupProps, "platform">) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-7 w-7 rounded-full object-contain" style={{ background: "rgba(255,255,255,0.1)" }} />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "var(--color-bg-raised)", color: "var(--color-text-muted)" }}>
            {brandName.charAt(0)}
          </div>
        )}
        <div>
          <div className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{brandName}</div>
          <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Sponsrad</div>
        </div>
      </div>
      <div className="aspect-square w-full">{children}</div>
      <div
        className="flex items-center gap-3 px-3 py-1.5 text-[11px]"
        style={{ color: "var(--color-text-muted)", borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span>👍 Gilla</span>
        <span>💬 Kommentera</span>
        <span>↗ Dela</span>
      </div>
    </div>
  );
}

function GoogleMockup({ brandName, children }: Omit<PlatformMockupProps, "platform">) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2 text-[13px]"
        style={{
          color: "var(--color-text-muted)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <span>Annons</span>
        <span>·</span>
        <span>{brandName}</span>
      </div>
      <div className="aspect-[1.91/1] w-full">{children}</div>
    </div>
  );
}

function LinkedInMockup({ brandName, logoUrl, children }: Omit<PlatformMockupProps, "platform">) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 text-[13px]"
        style={{
          color: "var(--color-text-secondary)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-8 w-8 rounded" />
        ) : (
          <div
            className="h-8 w-8 rounded"
            style={{ background: "var(--color-bg-raised)" }}
          />
        )}
        <div>
          <div className="font-medium" style={{ color: "var(--color-text-primary)" }}>
            {brandName}
          </div>
          <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            Sponsrad · 1 234 följare
          </div>
        </div>
      </div>
      <div className="aspect-[4/3] w-full">{children}</div>
      <div
        className="flex items-center gap-4 px-3.5 py-2 text-[12px]"
        style={{
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border-subtle)",
        }}
      >
        <span>👍 12</span>
        <span>💬 3</span>
        <span>↗ 1</span>
      </div>
    </div>
  );
}

export function PlatformMockup({ platform, ...props }: PlatformMockupProps) {
  switch (platform) {
    case "meta":
      return <MetaMockup {...props} />;
    case "google":
      return <GoogleMockup {...props} />;
    case "linkedin":
      return <LinkedInMockup {...props} />;
    default:
      return <MetaMockup {...props} />;
  }
}
