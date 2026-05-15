'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  googleId?: string | null;
  organization: { id: string; name: string };
  _count?: { memberships: number };
}

export interface OrgMembership {
  organizationId: string;
  organizationName: string;
  role: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberships: OrgMembership[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
  loadMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);

  const refresh = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberships = useCallback(async () => {
    try {
      const { data } = await authApi.memberships();
      setMemberships(data);
    } catch {
      setMemberships([]);
    }
  }, []);

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    await authApi.login({ email, password });
    await refresh();
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setMemberships([]);
  };

  const switchOrg = async (orgId: string) => {
    await authApi.switchOrg(orgId);
    await refresh();
    setMemberships((prev) => prev.map((m) => ({ ...m, isActive: m.organizationId === orgId })));
  };

  return (
    <AuthContext.Provider value={{ user, loading, memberships, login, logout, refresh, switchOrg, loadMemberships }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
