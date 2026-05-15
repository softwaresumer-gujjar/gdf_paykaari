'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { subscriptionApi } from './api';

export interface SubInfo {
  plan: string;
  planLabel: string;
  status: string;
  daysRemaining: number | null;
  isTrial: boolean;
  isFree: boolean;
  isExpiring: boolean;
  isExpired: boolean;
  isReadonly: boolean;
  features: {
    collection: boolean; delivery: boolean; billing: boolean;
    reports: boolean; accounts: boolean; transport: boolean;
    staff: boolean; multiUser: boolean;
    maxFarmers: number; maxRetailers: number;
  };
}

interface SubscriptionCtx {
  sub: SubInfo | null;
  loading: boolean;
  refresh: () => void;
}

const Ctx = createContext<SubscriptionCtx>({ sub: null, loading: true, refresh: () => {} });

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    subscriptionApi.current()
      .then((r) => setSub(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ sub, loading, refresh }}>{children}</Ctx.Provider>;
}

export const useSubscription = () => useContext(Ctx);
