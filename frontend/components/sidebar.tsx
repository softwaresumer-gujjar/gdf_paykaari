'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLang } from '@/lib/language-context';
import type { TranslationKey } from '@/lib/lang';

/* ── SVG icon helper (uses currentColor) ───────────────────────────────── */
const ic = (d: string | React.ReactNode) => (
  <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const Icons = {
  dashboard:     ic(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  farmers:       ic('M12 2a10 10 0 0 1 3.16 19.48C13.79 22 12.9 22 12 22s-1.79 0-3.16-.52A10 10 0 0 1 12 2zm0 0v4m0 16v-4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83'),
  retailers:     ic(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  collection:    ic(<><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></>),
  delivery:      ic(<><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>),
  marketRates:   ic(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>),
  billing:       ic(<><path d="M4 2h16v20l-3-2-2 2-2-2-2 2-2-2-3 2V2z" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /></>),
  payments:      ic(<><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>),
  reports:       ic(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></>),
  accounts:      ic(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><circle cx="16" cy="14" r="1" /></>),
  transport:     ic(<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></>),
  staff:         ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  scheduler:     ic(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  notifications: ic(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>),
  users:         ic(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  settings:      ic(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
} as const;

interface NavItem {
  href: string;
  key: TranslationKey;
  icon: keyof typeof Icons;
  iconColor: string;
  iconBg: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard',     key: 'dashboard',     icon: 'dashboard',     iconColor: 'text-blue-500',    iconBg: 'bg-blue-50 dark:bg-blue-950/50' },
  { href: '/farmers',       key: 'farmers',       icon: 'farmers',       iconColor: 'text-green-600',   iconBg: 'bg-green-50 dark:bg-green-950/50' },
  { href: '/retailers',     key: 'retailers',     icon: 'retailers',     iconColor: 'text-violet-500',  iconBg: 'bg-violet-50 dark:bg-violet-950/50' },
  { href: '/collection',    key: 'collection',    icon: 'collection',    iconColor: 'text-cyan-600',    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50' },
  { href: '/delivery',      key: 'delivery',      icon: 'delivery',      iconColor: 'text-orange-500',  iconBg: 'bg-orange-50 dark:bg-orange-950/50' },
  { href: '/market-rates',  key: 'marketRates',   icon: 'marketRates',   iconColor: 'text-amber-500',   iconBg: 'bg-amber-50 dark:bg-amber-950/50' },
  { href: '/billing',       key: 'billing',       icon: 'billing',       iconColor: 'text-indigo-500',  iconBg: 'bg-indigo-50 dark:bg-indigo-950/50' },
  { href: '/payments',      key: 'payments',      icon: 'payments',      iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950/50' },
  { href: '/reports',       key: 'reports',       icon: 'reports',       iconColor: 'text-sky-500',     iconBg: 'bg-sky-50 dark:bg-sky-950/50' },
  { href: '/accounts',      key: 'accounts',      icon: 'accounts',      iconColor: 'text-pink-500',    iconBg: 'bg-pink-50 dark:bg-pink-950/50' },
  { href: '/transport',     key: 'transport',     icon: 'transport',     iconColor: 'text-teal-600',    iconBg: 'bg-teal-50 dark:bg-teal-950/50' },
  { href: '/staff',         key: 'staff',         icon: 'staff',         iconColor: 'text-purple-500',  iconBg: 'bg-purple-50 dark:bg-purple-950/50' },
  { href: '/scheduler',     key: 'scheduler',     icon: 'scheduler',     iconColor: 'text-rose-500',    iconBg: 'bg-rose-50 dark:bg-rose-950/50' },
  { href: '/notifications', key: 'notifications', icon: 'notifications', iconColor: 'text-red-500',     iconBg: 'bg-red-50 dark:bg-red-950/50' },
  { href: '/users',         key: 'users',         icon: 'users',         iconColor: 'text-slate-500',   iconBg: 'bg-slate-100 dark:bg-slate-700/60', adminOnly: true },
];

interface SidebarProps { mobileOpen?: boolean; onClose?: () => void }

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const isAdmin = user?.role === 'ADMIN';
  const initial = (user?.name ?? user?.email ?? '?')[0]?.toUpperCase();

  const content = (
    <aside className="sidebar-bg w-64 flex flex-col h-full select-none">

      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 sb-header-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[0.9375rem] font-bold tracking-tight sb-brand-text">MilkFlow</div>
            <div className="text-[0.6875rem] truncate max-w-[130px] sb-brand-sub leading-tight">
              {user?.organization?.name ?? 'GDF Dairy'}
            </div>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose}
            className="lg:hidden sb-icon-btn w-7 h-7 flex items-center justify-center text-sm">
            ✕
          </button>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="sidebar-nav flex-1 py-2.5 px-3 overflow-y-auto space-y-0.5">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[0.625rem] text-[0.8125rem] font-medium transition-all duration-150 ${
                  active ? 'sb-nav-item-active' : 'sb-nav-item'
                }`}>
                <span className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  active
                    ? 'bg-white/15 text-white'
                    : `${item.iconBg} ${item.iconColor}`
                }`}>
                  {Icons[item.icon]}
                </span>
                <span className="truncate">{t(item.key)}</span>
              </Link>
            );
          })}
      </nav>

      {/* ── User footer ────────────────────────────────────────────────── */}
      <div className="p-3.5 sb-footer-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.8125rem] font-semibold truncate sb-text-active leading-tight">
              {user?.name ?? user?.email}
            </div>
            <div className="text-[0.6875rem] truncate sb-brand-sub leading-tight">{user?.email}</div>
          </div>
          <Link href="/settings" onClick={onClose} title={t('settings')}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center sb-icon-btn">
            {Icons.settings}
          </Link>
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="sb-role-badge">{user?.role}</span>
          <button type="button" onClick={logout}
            className="text-[0.75rem] font-medium transition-colors sb-sign-out">
            {t('signOut')} →
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-full flex-shrink-0">{content}</div>
      {/* Mobile: fixed panel, no backdrop overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-y-0 ltr:left-0 rtl:right-0 z-50 flex shadow-2xl">
          {content}
        </div>
      )}
    </>
  );
}
