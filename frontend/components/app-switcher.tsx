'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type OrgMembership } from '@/lib/auth-context';

function WaffleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="5" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  );
}

function OrgInitial({ name, active }: { name: string; active: boolean }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
      active
        ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-1'
        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
    }`}>
      {initials || '?'}
    </div>
  );
}

export default function AppSwitcher() {
  const { user, memberships, loadMemberships, switchOrg } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && memberships.length === 0) loadMemberships();
  }, [open, memberships.length, loadMemberships]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitch = async (m: OrgMembership) => {
    if (m.isActive) { setOpen(false); return; }
    setSwitching(m.organizationId);
    try {
      await switchOrg(m.organizationId);
      setOpen(false);
      router.push('/dashboard');
      router.refresh();
    } finally {
      setSwitching(null);
    }
  };

  // Only render if multi-org or to show org info
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Switch organization"
        className={`topbar-icon-btn ${open ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100' : ''}`}
      >
        <WaffleIcon />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Your Organizations</p>
          </div>

          {/* Org list */}
          <div className="py-2 max-h-72 overflow-y-auto">
            {memberships.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
                Loading…
              </div>
            ) : (
              memberships.map((m) => (
                <button
                  key={m.organizationId}
                  type="button"
                  onClick={() => handleSwitch(m)}
                  disabled={switching === m.organizationId}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors text-left disabled:opacity-60"
                >
                  <OrgInitial name={m.organizationName} active={m.isActive} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${m.isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-slate-100'}`}>
                      {m.organizationName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 capitalize">{m.role.toLowerCase()}</p>
                  </div>
                  {m.isActive && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {switching === m.organizationId && (
                    <span className="flex-shrink-0 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3">
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
              Signed in as <span className="font-medium text-gray-600 dark:text-slate-400">{user?.email}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
