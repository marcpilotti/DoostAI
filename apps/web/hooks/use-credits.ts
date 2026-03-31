"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useCredits — tracks credit balance.
 * Currently fetches from mock API. Replace with Supabase real-time
 * subscription on credit_ledger table.
 */
export function useCredits(orgId: string = "demo") {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async () => {
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

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetch_();
  }, [fetch_]);

  return {
    balance: balance ?? 0,
    isLoading,
    refetch,
  };
}
