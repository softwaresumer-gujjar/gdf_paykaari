'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useLang } from '@/lib/language-context';
import type { TranslationKey } from '@/lib/lang';
import Sidebar from '@/components/sidebar';
import AppSwitcher from '@/components/app-switcher';
import { notificationsApi, farmersApi, retailersApi } from '@/lib/api';
import { useClickOutside } from '@/lib/use-click-outside';
import { SubscriptionProvider } from '@/lib/subscription-context';
import { SubscriptionBanner } from '@/components/subscription-banner';

/* ── Page-name map ─────────────────────────────────────────────────────── */
const PAGE_MAP: { prefix: string; key: TranslationKey }[] = [
  { prefix: '/dashboard',     key: 'dashboard' },
  { prefix: '/farmers',       key: 'farmers' },
  { prefix: '/retailers',     key: 'retailers' },
  { prefix: '/collection',    key: 'collection' },
  { prefix: '/delivery',      key: 'delivery' },
  { prefix: '/market-rates',  key: 'marketRates' },
  { prefix: '/billing',       key: 'billing' },
  { prefix: '/payments',      key: 'payments' },
  { prefix: '/reports',       key: 'reports' },
  { prefix: '/accounts',      key: 'accounts' },
  { prefix: '/transport',     key: 'transport' },
  { prefix: '/staff',         key: 'staff' },
  { prefix: '/scheduler',     key: 'scheduler' },
  { prefix: '/notifications', key: 'notifications' },
  { prefix: '/users',         key: 'users' },
  { prefix: '/settings',      key: 'settings' },
];

/* ── Topbar icons ──────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

interface SearchResult { id: string; label: string; sub: string; href: string; }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = (user?.name ?? user?.email ?? '?')[0]?.toUpperCase();
  const isDashboard = pathname === '/dashboard';

  /* ── Notifications unread count ─────────────────────────────────────── */
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = () => notificationsApi.unreadCount()
      .then((r) => { if (!cancelled) setUnreadCount((prev) => { const n = r.data?.count ?? 0; return prev === n ? prev : n; }); })
      .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* ── Global search ───────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const searchDataRef = useRef<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSearchData = useCallback(() => {
    if (searchLoaded) return;
    Promise.all([farmersApi.list(), retailersApi.list()]).then(([fr, rr]) => {
      const items: SearchResult[] = [
        ...(fr.data ?? []).map((f: { id: string; name: string; phone?: string }) => ({
          id: `f-${f.id}`, label: f.name, sub: f.phone ?? 'Farmer', href: `/farmers`,
        })),
        ...(rr.data ?? []).map((r: { id: string; name: string; phone?: string }) => ({
          id: `r-${r.id}`, label: r.name, sub: r.phone ?? 'Retailer', href: `/retailers`,
        })),
      ];
      searchDataRef.current = items;
      setSearchLoaded(true);
    }).catch(() => {});
  }, [searchLoaded]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      searchDataRef.current
        .filter((i) => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q))
        .slice(0, 8)
    );
  }, [searchQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
        loadSearchData();
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [loadSearchData]);

  useClickOutside(searchRef, () => setSearchOpen(false));

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">
        {t('loading')}
      </div>
    );
  }
  if (!user) return null;

  const pageKey = PAGE_MAP.find((p) => pathname.startsWith(p.prefix))?.key ?? 'dashboard';

  return (
    <SubscriptionProvider>
    <div className="flex h-screen overflow-hidden app-bg">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div className="app-topbar flex items-center gap-3 px-4 py-2.5 flex-shrink-0">

          {/* Mobile hamburger */}
          <button type="button" title="Open menu" onClick={() => setMobileOpen(true)}
            className="lg:hidden topbar-icon-btn">
            <MenuIcon />
          </button>

          {/* Breadcrumb / Welcome — desktop */}
          <div className="hidden lg:flex flex-col justify-center flex-shrink-0 min-w-0">
            {isDashboard ? (
              <>
                <span className="text-[0.8125rem] font-medium text-gray-700 dark:text-slate-300 leading-snug">
                  Welcome back,{' '}
                  <span className="font-bold text-gray-900 dark:text-slate-100">
                    {user?.name ?? user?.email}
                  </span>
                </span>
                <span className="text-[0.6875rem] text-gray-400 dark:text-slate-500 leading-tight">
                  Here&apos;s what&apos;s happening today.
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-none">
                  {t(pageKey)}
                </span>
                {user?.organization?.name && (
                  <span className="text-[0.6875rem] text-gray-400 dark:text-slate-500 truncate max-w-[180px] leading-tight">
                    {user.organization.name}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Mobile brand */}
          <span className="lg:hidden text-base font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
            MilkFlow
          </span>

          {/* Search bar — fills center */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <span className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => { setSearchOpen(true); loadSearchData(); }}
              placeholder={`${t('search')} — farmers, retailers…`}
              className="topbar-search ltr:pl-9 rtl:pr-9 ltr:pr-16 rtl:pl-16"
            />
            <div className="absolute ltr:right-2.5 rtl:left-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
              <kbd className="px-1 py-0.5 text-[10px] text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-600 rounded font-mono leading-none">⌘</kbd>
              <kbd className="px-1 py-0.5 text-[10px] text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-600 rounded font-mono leading-none">K</kbd>
            </div>
            {/* Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full ltr:left-0 rtl:right-0 mt-1.5 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                {searchResults.map((r) => (
                  <button key={r.id} type="button"
                    className="w-full ltr:text-left rtl:text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition-colors"
                    onClick={() => { router.push(r.href); setSearchOpen(false); setSearchQuery(''); }}>
                    <span className="text-[0.8125rem] font-medium text-gray-900 dark:text-slate-100">{r.label}</span>
                    <span className="text-[0.75rem] text-gray-400 dark:text-slate-500">{r.sub}</span>
                  </button>
                ))}
              </div>
            )}
            {searchOpen && searchQuery.trim() && searchResults.length === 0 && searchLoaded && (
              <div className="absolute top-full ltr:left-0 rtl:right-0 mt-1.5 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 z-50">
                <span className="text-[0.8125rem] text-gray-400 dark:text-slate-500">{t('noResults')}</span>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* App / org switcher */}
            <AppSwitcher />

            {/* Notification bell */}
            <button type="button" title={t('notifications')} onClick={() => router.push('/notifications')}
              className="topbar-icon-btn relative">
              <BellIcon />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 ring-[1.5px] ring-white dark:ring-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-[5px] right-[5px] w-[6px] h-[6px] bg-green-500 rounded-full ring-[1.5px] ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Language switcher */}
            <div className="lang-toggle">
              <button type="button" onClick={() => setLang('en')}
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}>EN</button>
              <button type="button" onClick={() => setLang('ur')}
                className={`lang-btn ${lang === 'ur' ? 'active' : ''}`}>اردو</button>
            </div>

            {/* Theme toggle */}
            <button type="button" onClick={toggleTheme}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              className="topbar-icon-btn">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* User avatar + name */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700 flex-shrink-0 cursor-default">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-white dark:ring-slate-800">
                {initial}
              </div>
              <span className="hidden xl:block text-[0.8125rem] font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[100px]">
                {user?.name ?? user?.email}
              </span>
            </div>
          </div>
        </div>

        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">{children}</main>
      </div>
    </div>
    </SubscriptionProvider>
  );
}
