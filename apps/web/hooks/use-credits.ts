"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useCredits — fetches credit balance from API.
 */
export function useCredits(orgId: string = "demo") {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await globalThis.fetch(`/api/credits/balance?orgId=${orgId}`);
      const data = await res.json();
      setBalance(data.balance ?? 0);
    } catch {
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
}
