"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Key,
  Linkedin,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/60 p-6 backdrop-blur-sm">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function PlatformRow({
  name,
  icon: Icon,
  color,
  connected,
  accountType,
}: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  connected: boolean;
  accountType: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{accountType}</div>
      </div>
      {connected ? (
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ansluten
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" />
          Ej ansluten
        </div>
      )}
    </div>
  );
}

function MetaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Inställningar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hantera ditt konto och anslutningar.
        </p>
      </div>

      <SettingsCard
        title="Organisation"
        description="Grundläggande information om ditt företag."
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Namn
            </label>
            <div className="mt-1 text-sm font-medium">
              {user?.fullName ?? "Mitt Företag"}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              E-post
            </label>
            <div className="mt-1 text-sm">
              {user?.primaryEmailAddress?.emailAddress ?? "-"}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Anslutna plattformar"
        description="Annonsplattformar kopplade till ditt konto."
      >
        <div className="divide-y divide-border/40">
          <PlatformRow
            name="Meta / Instagram"
            icon={MetaIcon}
            color="#1877F2"
            connected={false}
            accountType="Automatiskt konto via Business Manager"
          />
          <PlatformRow
            name="Google Ads"
            icon={GoogleIcon}
            color="#4285F4"
            connected={false}
            accountType="Automatiskt konto via MCC"
          />
          <PlatformRow
            name="LinkedIn"
            icon={Linkedin}
            color="#0077B5"
            connected={false}
            accountType="Kräver OAuth-anslutning"
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Teammedlemmar" description="Hantera åtkomst till kontot.">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-sm text-muted-foreground">
            Teamhantering via Clerk Organizations — kommer snart.
          </div>
        </div>
      </SettingsCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsCard title="Fakturering">
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Hantera prenumeration
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </SettingsCard>

        <SettingsCard title="API-nycklar">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Tillgängligt med Agency-planen.
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
