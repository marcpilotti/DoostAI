/**
 * Guest session management for Level 0 (anonymous) users.
 * Stores onboarding progress in localStorage with 7-day TTL.
 * When user signs up (Level 1), data is migrated to their org.
 */

const GUEST_KEY = "doost:guest-session";
const GUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type GuestSession = {
  id: string;
  createdAt: number;
  brandProfile?: Record<string, unknown>;
  adData?: Record<string, unknown>;
  selectedChannels?: string[];
};

export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as GuestSession;
    if (Date.now() - session.createdAt > GUEST_TTL_MS) {
      localStorage.removeItem(GUEST_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveGuestSession(data: Partial<Omit<GuestSession, "id" | "createdAt">>) {
  if (typeof window === "undefined") return;
  try {
    const existing = getGuestSession();
    const session: GuestSession = {
      id: existing?.id ?? `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: existing?.createdAt ?? Date.now(),
      ...existing,
      ...data,
    };
    localStorage.setItem(GUEST_KEY, JSON.stringify(session));
  } catch { /* quota exceeded */ }
}

export function clearGuestSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_KEY);
}

/**
 * Export guest data for migration to authenticated user.
 * Call this after Clerk sign-up to move data to the user's org.
 */
export function exportGuestData(): GuestSession | null {
  const session = getGuestSession();
  if (session) clearGuestSession();
  return session;
}
